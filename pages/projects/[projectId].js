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
  const [
    isUserAlreadyVoteThisProject,
    setIsUserAlreadyVoteThisProject,
  ] = useState(false);
  const [alreadyVotedLoading, setAlreadyVotedLoading] = useState(false);
  const [participantsColorPropAdded, setParticipantsColorPropAdded] = useState(
    false
  );
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

  const checkUserAlreadyVoted = () => {
    if (state.user.loggedIn && project) {
      let isUserAlreadyVoteThisProject = false;
      if (state.user.loggedIn) {
        const tryFind = project.alreadyVoted.find(
          (vote) => vote.wallet === state.user.wallet.toLocaleLowerCase()
        );
        if (tryFind) {
          isUserAlreadyVoteThisProject = tryFind.participantId;
        }
        setIsUserAlreadyVoteThisProject(isUserAlreadyVoteThisProject);
      }
    } else {
      setIsUserAlreadyVoteThisProject(false);
    }
  };

  const refreshAlreadyVoted = async () => {
    if (router.query.projectId) {
      try {
        setAlreadyVotedLoading(true);
        const response = await axios(`/api/projects/${router.query.projectId}`);
        await updateProjectWithTheGivenProject(response);
      } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
          return alert.error(e.response.data.message);
        }
        return alert.error(e.message);
      }
    }
  };

  const updateProjectWithTheGivenProject = async (response) => {
    try {
      const totalSupply = 1000000;
      const response = await axios(`/api/projects/${router.query.projectId}`);
      if (response && response.data && response.data.project) {
        let participantsUpdate;

        if (participantsColorPropAdded) {
          participantsUpdate = response.data.project.participants.map((p) => {
            const participantId = p._id;
            const tryFind = project.participants.find(
              (p) => p._id === participantId
            );

            console.log({ tryFind });
            if (tryFind) {
              return {
                ...p,
                color: tryFind.color,
              };
            } else {
              const borderColor = randomColor({
                format: "rgba",
                alpha: 1,
              });
              const bgColor =
                borderColor.substr(0, borderColor.length - 2) + "0.2)";

              return {
                ...p,
                color: {
                  bg: bgColor,
                  border: borderColor,
                },
              };
            }
          });
        } else {
          participantsUpdate = response.data.project.participants;
        }

        if (!participantsColorPropAdded) {
          participantsUpdate = participantsUpdate.map((p) => {
            const borderColor = randomColor({
              format: "rgba",
              alpha: 1,
            });
            const bgColor =
              borderColor.substr(0, borderColor.length - 2) + "0.2)";

            return {
              ...p,
              color: {
                bg: bgColor,
                border: borderColor,
              },
            };
          });
          setParticipantsColorPropAdded(true);
        }

        const totalTokenVoted = response.data.project.participants
          .map((p) => p.voteCount)
          .reduce((a, b) => a + b, 0);

        console.log({ totalTokenVoted });

        if (totalTokenVoted === 0) {
          participantsUpdate = participantsUpdate.map((p) => {
            return {
              ...p,
              votePercentage: "0",
            };
          });
        } else {
          participantsUpdate = participantsUpdate.map((p) => {
            const votePercentageNumber = (p.voteCount / totalTokenVoted) * 100;
            const votePercentageString = String(votePercentageNumber).substr(
              0,
              5
            );

            return {
              ...p,
              votePercentage: votePercentageString,
            };
          });
        }

        setProject({
          ...project,
          ...response.data.project,
          loading: false,
          participants: participantsUpdate,
          pieChartData: {
            ...emptyPieChartData,
            labels: participantsUpdate.map((p) => p.author),
            datasets: [
              {
                ...emptyPieChartData.datasets[0],
                data: participantsUpdate.map((p) => p.voteCount),
                backgroundColor: participantsUpdate.map((p) => p.color.bg),
                borderColor: participantsUpdate.map((p) => p.color.border),
              },
            ],
          },
        });
        setAlreadyVotedLoading(false);
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.message) {
        return alert.error(e.response.data.message);
      }
      return alert.error(e.message);
    }
  };

  useEffect(() => {
    checkUserAlreadyVoted();
  }, [state.user.loggedIn, project]);

  useEffect(async () => {
    if (router.query.projectId) {
      try {
        const response = await axios(`/api/projects/${router.query.projectId}`);
        await updateProjectWithTheGivenProject(response);
      } catch (e) {
        if (e.response && e.response.status === 404) {
          return router.push("/");
        }
        if (e.response && e.response.data && e.response.data.message) {
          return alert.error(e.response.data.message);
        }
        return alert.error(e.message);
      }
    }
  }, [router.query.projectId]);

  const signAndUpdateState = async () => {
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

      await signAndUpdateState();
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

          await updateProjectWithTheGivenProject(response);
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

          await updateProjectWithTheGivenProject(response);
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
            <Header as="h1" className="projects-title">
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
            {project.participants.length > 0 ? (
              <>
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
                          {!isUserAlreadyVoteThisProject && (
                            <Radio
                              checked={project.selectedParticipant === index}
                            />
                          )}
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
                        <div className="option-votePercent">{`${p.votePercentage}%`}</div>
                        {isUserAlreadyVoteThisProject &&
                          isUserAlreadyVoteThisProject == p._id && (
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
                {isUserAlreadyVoteThisProject ? null : (
                  <div className="submit-vote-row">
                    <Button onClick={onClickVoteBtn} primary>
                      Submit
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Header as="h4">No participants for this project yet</Header>
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
              <Button
                icon
                className={clsx({
                  "refresh-button": true,
                  refreshing: alreadyVotedLoading,
                })}
                onClick={refreshAlreadyVoted}
              >
                <Icon size="tiny" name="refresh" />
              </Button>
            </Header>

            {lastVoteSprings.length > 0 ? (
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
                      <Feed.Content
                      // style={{
                      //   backgroundColor: findParticipant.color.bg,
                      // }}
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
            ) : (
              <Header as="h4">No one vote this project yet</Header>
            )}
          </div>
          <div className="sticky-wrapper-outside">
            <div className="chart">{pieChartMemo}</div>
            <div className="dates">
              <div className="date">
                <span className="date-title">START</span>
                <span className="date-content">
                  <span className="top">
                    {new Date(Number(project.start_date)).toLocaleDateString()}
                  </span>
                  <span className="bottom">
                    {" "}
                    {new Date(Number(project.start_date)).toLocaleString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      }
                    )}
                  </span>
                </span>
              </div>
              <div className="date">
                <span className="date-title">END</span>
                <span className="date-content">
                  <span className="top">
                    {new Date(Number(project.end_date)).toLocaleDateString()}
                  </span>
                  <span className="bottom">
                    {new Date(Number(project.end_date)).toLocaleString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      }
                    )}
                  </span>
                </span>
              </div>
            </div>
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
