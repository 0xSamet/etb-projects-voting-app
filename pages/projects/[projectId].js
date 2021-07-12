import {
  Button,
  Dimmer,
  Divider,
  Feed,
  Header,
  Icon,
  Loader,
  Modal,
  Radio,
  Segment,
} from "semantic-ui-react";
import { Pie } from "react-chartjs-2";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { EditorState } from "draft-js";
import axios from "axios";
import EditorView from "../../components/EditorView";
import randomColor from "randomcolor";
import { useAlert } from "react-alert";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";
import { useWalletConnectContext } from "../../lib/walletConnectContext";
import { convertUtf8ToHex } from "@walletconnect/utils";
import { userLoginSuccess, userLogout } from "../../store";
import { recoverPersonalSignature } from "eth-sig-util";
import { useSpring, useSprings, animated } from "react-spring";
import moment from "moment";
import Web3 from "web3";
import Token from "../../lib/ETBToken.json";

export default function ProjectDetail() {
  const router = useRouter();
  const alert = useAlert();
  const [emptyPieChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1,
      },
    ],
  });
  const [project, setProject] = useState({
    loading: true,
    name: "",
    description: "",
    start_date: new Date(),
    end_date: new Date(),
    participants: [],
    pieChartData: { ...emptyPieChartData },
    selectedParticipant: null,
    alreadyVoted: [],
    walletConnectSign: {
      signature: "",
      signedMessage: "",
    },
    metamaskSign: {
      signature: "",
      signedMessage: "",
    },
    isUserAlreadyVoteThisProject: false,
  });
  const [modals, setModals] = useState({
    1: {
      confirmed: false,
      show: false,
    },
    2: {
      confirmed: false,
      show: false,
    },
  });
  const state = useSelector((state) => state);
  const { walletConnect } = useWalletConnectContext();
  const dispatch = useDispatch();

  const lastVoteSprings = useSprings(
    project.alreadyVoted.length,
    project.alreadyVoted.map((person) => ({
      from: { opacity: 0, x: 100 },
      to: { opacity: 1, x: 0 },
      onStart: function (a) {
        const feedEl = document.querySelector(".last-votes .feed");
        feedEl.scrollTop = -feedEl.scrollHeight;
      },
    }))
  );

  useEffect(async () => {
    if (walletConnect.connected) {
      const { accounts } = walletConnect;
      console.log({ walletConnect });
      dispatch(
        userLoginSuccess({
          wallet: accounts[0],
          connectedWith: "wallet-connect",
        })
      );
    }
  }, []);

  useEffect(() => {
    if (state.user.loggedIn && project) {
      let isUserAlreadyVoteThisProject = false;
      if (state.user.loggedIn) {
        const tryFind = project.alreadyVoted.find(
          (vote) => vote.wallet === state.user.wallet.toLocaleLowerCase()
        );
        if (tryFind) {
          isUserAlreadyVoteThisProject = tryFind.participantId;
        }
        setProject({ ...project, isUserAlreadyVoteThisProject });
      }
    } else {
      setProject({ ...project, isUserAlreadyVoteThisProject: false });
    }
  }, [state.user.loggedIn]);

  useEffect(() => {
    if (router.query.projectId) {
      const getProject = async () => {
        try {
          const response = await axios(
            `/api/projects/${router.query.projectId}`
          );
          if (response && response.data && response.data.project) {
            const participantsColorPropAdded = response.data.project.participants.map(
              (p) => {
                const borderColor = randomColor({ format: "rgba", alpha: 1 });
                const bgColor =
                  borderColor.substr(0, borderColor.length - 2) + "0.2)";
                // const borderColor =
                return {
                  ...p,
                  color: {
                    bg: bgColor,
                    border: borderColor,
                  },
                };
              }
            );

            const newPieChartData = { ...emptyPieChartData };
            participantsColorPropAdded.forEach((p) => {
              newPieChartData.labels.push(p.author);
              newPieChartData.datasets[0].data.push(p.voteCount);
              newPieChartData.datasets[0].backgroundColor.push(p.color.bg);
              newPieChartData.datasets[0].borderColor.push(p.color.border);
            });

            setProject({
              ...project,
              ...response.data.project,
              loading: false,
              participants: participantsColorPropAdded,
              pieChartData: newPieChartData,
            });
          }
        } catch (e) {
          if (e.response && e.response.data && e.response.data.message) {
            return alert.error(e.response.data.message);
          }
          return alert.error(e.message);
        }
      };
      getProject();
    }
  }, [router.query.projectId]);

  const walletConnectSign = async () => {
    if (!state.user.loggedIn) {
      await walletConnect.killSession();
      return dispatch(userLogout());
    }

    const messageToSign = JSON.stringify({
      projectId: router.query.projectId,
      participantId: project.participants[project.selectedParticipant]._id,
    });

    const msgParams = [
      convertUtf8ToHex(messageToSign), // Required
      state.user.wallet, // Required
    ];

    if (state.user.connectedWith === "wallet-connect") {
      walletConnect // Sign personal message
        .signPersonalMessage(msgParams)
        .then((result) => {
          // Returns signature.
          console.log(result);

          const recovered = recoverPersonalSignature({
            data: convertUtf8ToHex(messageToSign),
            sig: result,
          });

          if (
            recovered.toLocaleLowerCase() ===
            state.user.wallet.toLocaleLowerCase()
          ) {
            return setProject({
              ...project,
              walletConnectSign: {
                ...project.walletConnectSign,
                signature: result,
                signedMessage: messageToSign,
              },
            });
          }

          return alert.error("Sign Failed");
        })
        .catch((error) => {
          // Error returned when rejected
          setModals({
            ...modals,
            1: {
              show: false,
              confirmed: false,
            },
            2: {
              show: false,
              confirmed: false,
            },
          });
          if (error.message == "User canceled") {
            return alert.error("Sign Canceled!");
          } else {
            console.error(error);
          }
        });
    }
    if (state.user.connectedWith === "metamask") {
      web3.currentProvider.sendAsync(
        {
          method: "personal_sign",
          params: msgParams,
          from: state.user.wallet,
        },
        function (err, result) {
          if (err) {
            if (err.code === 4001) {
              setModals({
                ...modals,
                1: {
                  show: false,
                  confirmed: false,
                },
                2: {
                  show: false,
                  confirmed: false,
                },
              });
              alert.error("Sign Canceled!");
            }
            return console.error(err);
          }
          if (result.error) return console.error(result.error);

          const recovered = recoverPersonalSignature({
            data: messageToSign,
            sig: result.result,
          });

          if (
            recovered.toLocaleLowerCase() ===
            state.user.wallet.toLocaleLowerCase()
          ) {
            return setProject({
              ...project,
              metamaskSign: {
                ...project.metamaskSign,
                signature: result.result,
                signedMessage: messageToSign,
              },
            });
          }
          return alert.error("Sign Failed");
        }
      );
    }
  };

  useEffect(async () => {
    if (modals[1].confirmed) {
      setModals({
        ...modals,
        1: {
          show: false,
          confirmed: true,
        },
        2: {
          show: true,
          confirmed: false,
        },
      });

      await walletConnectSign();
    }
  }, [modals[1].confirmed]);

  useEffect(async () => {
    if (project.walletConnectSign.signature) {
      if (router.query && router.query.projectId) {
        try {
          const response = await axios.post(
            `/api/projects/${router.query.projectId}/vote`,
            {
              signature: project.walletConnectSign.signature,
              signedMessage: project.walletConnectSign.signedMessage,
              wallet: state.user.wallet,
            }
          );

          if (response && response.data && response.data.project) {
            const participantsColorPropAdded = response.data.project.participants.map(
              (p) => {
                const borderColor = randomColor({ format: "rgba", alpha: 1 });
                const bgColor =
                  borderColor.substr(0, borderColor.length - 2) + "0.2)";
                // const borderColor =
                return {
                  ...p,
                  color: {
                    bg: bgColor,
                    border: borderColor,
                  },
                };
              }
            );

            const newPieChartData = { ...emptyPieChartData };
            participantsColorPropAdded.forEach((p) => {
              newPieChartData.labels.push(p.author);
              newPieChartData.datasets[0].data.push(p.voteCount);
              newPieChartData.datasets[0].backgroundColor.push(p.color.bg);
              newPieChartData.datasets[0].borderColor.push(p.color.border);
            });

            setProject({
              ...project,
              ...response.data.project,
              loading: false,
              participants: participantsColorPropAdded,
              pieChartData: newPieChartData,
            });
            setModals({
              ...modals,
              1: {
                show: false,
                confirmed: true,
              },
              2: {
                show: false,
                confirmed: true,
              },
            });
          }
        } catch (e) {
          setProject({
            ...project,
            walletConnectSign: {
              ...project.walletConnectSign,
              signature: "",
              signedMessage: "",
            },
          });
          setModals({
            ...modals,
            1: {
              show: false,
              confirmed: false,
            },
            2: { show: false, confirmed: false },
          });
          if (e.response && e.response.data && e.response.data.message) {
            return alert.error(e.response.data.message);
          }
          return alert.error(e.message);
        }
      } else {
        router.push("/");
      }
    }
  }, [project.walletConnectSign.signature]);

  useEffect(async () => {
    if (project.metamaskSign.signature) {
      if (router.query && router.query.projectId) {
        try {
          const response = await axios.post(
            `/api/projects/${router.query.projectId}/vote`,
            {
              signature: project.metamaskSign.signature,
              signedMessage: project.metamaskSign.signedMessage,
              wallet: state.user.wallet,
            }
          );

          if (response && response.data && response.data.project) {
            const participantsColorPropAdded = response.data.project.participants.map(
              (p) => {
                const borderColor = randomColor({ format: "rgba", alpha: 1 });
                const bgColor =
                  borderColor.substr(0, borderColor.length - 2) + "0.2)";
                // const borderColor =
                return {
                  ...p,
                  color: {
                    bg: bgColor,
                    border: borderColor,
                  },
                };
              }
            );

            const newPieChartData = { ...emptyPieChartData };
            participantsColorPropAdded.forEach((p) => {
              newPieChartData.labels.push(p.author);
              newPieChartData.datasets[0].data.push(p.voteCount);
              newPieChartData.datasets[0].backgroundColor.push(p.color.bg);
              newPieChartData.datasets[0].borderColor.push(p.color.border);
            });

            setProject({
              ...project,
              ...response.data.project,
              loading: false,
              participants: participantsColorPropAdded,
              pieChartData: newPieChartData,
            });
            setModals({
              ...modals,
              1: {
                show: false,
                confirmed: true,
              },
              2: {
                show: false,
                confirmed: true,
              },
            });
          }
        } catch (e) {
          setProject({
            ...project,
            metamaskSign: {
              ...project.metamaskSign,
              signature: "",
              signedMessage: "",
            },
          });
          setModals({
            ...modals,
            1: {
              show: false,
              confirmed: false,
            },
            2: { show: false, confirmed: false },
          });
          if (e.response && e.response.data && e.response.data.message) {
            return alert.error(e.response.data.message);
          }
          return alert.error(e.message);
        }
      } else {
        router.push("/");
      }
    }
  }, [project.metamaskSign.signature]);

  const onClickVoteBtn = async () => {
    //find participant id by index
    let participantId;

    if (project.selectedParticipant || project.selectedParticipant === 0) {
      participantId = project.participants[project.selectedParticipant]._id;
    } else {
      return alert.error("Please make a choice!");
    }

    //confirm modals first
    if (!modals[1].confirmed && !modals[2].confirmed) {
      return setModals({
        ...modals,
        1: {
          show: true,
          confirmed: false,
        },
        2: {
          show: false,
          confirmed: false,
        },
      });
    }
  };

  const pieChartMemo = useMemo(() => <Pie data={project.pieChartData} />, [
    project.participants,
  ]);

  return (
    <div className="project-page">
      {project.loading ? (
        <Dimmer active inverted>
          <Loader size="medium">Loading</Loader>
        </Dimmer>
      ) : (
        <>
          <div className="project-detail">
            <Header as="h1" className="projects-title" textAlign="center">
              {project.name}
            </Header>
            <Divider />
            <div className="project-description">
              <EditorView description={project.description} />
            </div>
          </div>
          <div
            className={clsx({
              "options-wrapper": true,
              "need-login-active": !state.user.loggedIn,
            })}
          >
            <Header as="h3" className="options-title">
              Vote This Project
            </Header>
            {project.participants.map((p, index) => {
              // let isChecked = false;

              // if (project.isUserAlreadyVoteThisProject) {
              //   const tryFind =
              // }

              return (
                <div
                  className="option"
                  key={p._id}
                  onClick={() =>
                    setProject({ ...project, selectedParticipant: index })
                  }
                >
                  <Segment
                    compact
                    style={{
                      borderColor: p.color.border,
                    }}
                  >
                    <div className="option-left">
                      <Radio checked={project.selectedParticipant === index} />
                    </div>
                    <div className="option-right">
                      <div className="option-right-top">
                        <span className="bolder">Author: </span>
                        <span>{p.author}</span>
                      </div>
                      <div className="option-right-bottom">
                        <span className="bolder">Source: </span>
                        <span>{p.source}</span>
                      </div>
                    </div>
                    <div
                      className="option-bg"
                      style={{
                        background: p.color.bg,
                        width: `${p.voteCount}%`,
                      }}
                    ></div>
                    <div className="option-votePercent">{`${p.voteCount}%`}</div>
                    {project.isUserAlreadyVoteThisProject &&
                      project.isUserAlreadyVoteThisProject == p._id && (
                        <div className="option-checked">
                          <svg viewBox="0 0 507.2 507.2">
                            <circle
                              cx="253.6"
                              cy="253.6"
                              r="253.6"
                              fill={p.color.border}
                            />
                            <path
                              d="M188.8 368l130.4 130.4c108-28.8 188-127.2 188-244.8v-7.2L404.8 152l-216 216z"
                              fill={p.color.border}
                            />
                            <g fill="#fff">
                              <path d="M260 310.4c11.2 11.2 11.2 30.4 0 41.6l-23.2 23.2c-11.2 11.2-30.4 11.2-41.6 0L93.6 272.8c-11.2-11.2-11.2-30.4 0-41.6l23.2-23.2c11.2-11.2 30.4-11.2 41.6 0L260 310.4z" />
                              <path d="M348.8 133.6c11.2-11.2 30.4-11.2 41.6 0l23.2 23.2c11.2 11.2 11.2 30.4 0 41.6l-176 175.2c-11.2 11.2-30.4 11.2-41.6 0l-23.2-23.2c-11.2-11.2-11.2-30.4 0-41.6l176-175.2z" />
                            </g>
                          </svg>
                        </div>
                      )}
                  </Segment>
                </div>
              );
            })}
            {project.isUserAlreadyVoteThisProject ? null : (
              <div className="submit-vote-row">
                <Button onClick={onClickVoteBtn} primary>
                  Submit
                </Button>
              </div>
            )}
            <div className="vote-need-login-wrapper">
              <div className="message-box">
                <Header as="h3">You need the connect wallet to vote</Header>
              </div>
            </div>
          </div>
          <div className="last-votes">
            <Header as="h3" className="last-votes-title">
              Last Votes
              <Button icon className="refresh-button">
                <Icon size="tiny" name="refresh" />
              </Button>
            </Header>
            <Feed>
              {lastVoteSprings.map((styles, i, b) => {
                const voted = project.alreadyVoted[i];
                const findParticipant = project.participants.find(
                  (p) => p._id === voted.participantId
                );
                const dateFormat = moment(Number(voted.vote_date)).fromNow();

                return (
                  <animated.div
                    scrollTop={0}
                    className="ui event"
                    style={{
                      ...styles,
                      backgroundColor: findParticipant.color.bg,
                    }}
                    key={"vote-key-" + i}
                  >
                    <Feed.Label>
                      <img src="https://react.semantic-ui.com/images/avatar/small/elliot.jpg" />
                    </Feed.Label>
                    <Feed.Content
                      style={{
                        backgroundColor: findParticipant.color.bg,
                      }}
                    >
                      <Feed.Date>{dateFormat}</Feed.Date>
                      <span className="feed-wallet">{voted.wallet}</span>
                      {`  Voted For ${findParticipant.author}`}
                      <Divider />
                      <p>{`Have ${voted.tokenHave} ETB Tokens`}</p>
                    </Feed.Content>
                  </animated.div>
                );
              })}
            </Feed>
          </div>
          <div className="chart-wrapper-outside">
            <div className="chart-wrapper-inside">{pieChartMemo}</div>
          </div>
          <Modal
            open={modals[1].show}
            onClose={() =>
              setModals({
                1: {
                  show: false,
                  confirmed: false,
                },
                2: {
                  show: false,
                  confirmed: false,
                },
              })
            }
          >
            <Modal.Header>You need the sign a vote</Modal.Header>
            <Modal.Content image>
              <div className="image">
                <Icon name="right arrow" />
              </div>
              <Modal.Description>
                <p>
                  After Clicking a Proceed button Check Your Wallet for
                  signature
                </p>
              </Modal.Description>
            </Modal.Content>
            <Modal.Actions>
              <Button
                onClick={() =>
                  setModals({
                    ...modals,
                    1: { ...modals[1], confirmed: true },
                  })
                }
                primary
              >
                Proceed <Icon name="right chevron" />
              </Button>
            </Modal.Actions>
          </Modal>
          <Modal open={modals[2].show}>
            <Modal.Header>Waiting to sign</Modal.Header>
            <Modal.Content image>
              <div
                style={{
                  position: "relative",
                  minHeight: 100,
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Dimmer active inverted>
                  <Loader size="medium"></Loader>
                </Dimmer>
              </div>
            </Modal.Content>
          </Modal>
        </>
      )}
    </div>
  );
}
