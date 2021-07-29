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
import axios from "axios";
import EditorView from "../../components/EditorView";
import randomColor from "randomcolor";
import { useAlert } from "react-alert";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";
import { useWalletConnect } from "../../lib/walletConnect";
import { convertUtf8ToHex } from "@walletconnect/utils";
import { userLoginSuccess, userLogout } from "../../store";
import { recoverPersonalSignature } from "eth-sig-util";
import { useSprings, animated } from "react-spring";
import moment from "moment";
import BigNumber from "bignumber.js";
import Countdown from "react-countdown";
import numeral from "numeral";
import useWindowSize from "../../hooks/useWindowSize";

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
    isVotingStarted: false,
    isVotingEnded: false,
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
  const [hideRightSide, setHideRightSide] = useState(false);
  const [projectInterval, setProjectInterval] = useState(null);

  const state = useSelector((state) => state);
  const { walletConnect } = useWalletConnect();
  const dispatch = useDispatch();
  const windowSize = useWindowSize();

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

  useEffect(() => {
    if (windowSize.width && windowSize.height) {
      if (windowSize.width < 1350) {
        setHideRightSide(true);
      }
    }
  }, [windowSize]);

  useEffect(() => {
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
    let updateInterval = projectInterval;

    return () => {
      clearInterval(updateInterval);
    };
  }, [projectInterval]);

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

  const getProject = async () => {
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
      if (response && response.data && response.data.project) {
        let participantsUpdate = response.data.project.participants;

        participantsUpdate = participantsUpdate.map((p) => {
          const participantId = p._id;
          const tryFind = project.participants.find(
            (p) => p._id === participantId
          );
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

        const totalTokenVoted = response.data.project.participants
          .map((p) => p.voteCount)
          .reduce((a, b) => BigNumber(a).plus(b).toFixed(), "0");

        // console.log(totalTokenVoted);

        if (totalTokenVoted == 0) {
          participantsUpdate = participantsUpdate.map((p) => {
            return {
              ...p,
              votePercentage: "0",
            };
          });
        } else {
          participantsUpdate = participantsUpdate.map((p) => {
            const votePercentageNumber = BigNumber(p.voteCount)
              .dividedBy(totalTokenVoted)
              .multipliedBy(100)
              .toFixed();

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

        const currentDate = new Date().getTime();
        const startDate = response.data.project.start_date;
        const endDate = response.data.project.end_date;

        setProject({
          ...project,
          ...response.data.project,
          loading: false,
          participants: participantsUpdate,
          pieChartData: {
            ...emptyPieChartData,
            // labels: participantsUpdate.map((p) => p.author),
            datasets: [
              {
                ...emptyPieChartData.datasets[0],
                data: participantsUpdate.map((p) => Number(p.voteCount)),
                backgroundColor: participantsUpdate.map((p) => p.color.bg),
                borderColor: participantsUpdate.map((p) => p.color.border),
              },
            ],
          },
          isVotingStarted: currentDate - startDate > 0,
          isVotingEnded: endDate - currentDate < 0,
        });
        setAlreadyVotedLoading(false);
      }
    } catch (e) {
      if (e.response.status === 404) {
        return router.push("/");
      }
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
      clearInterval(projectInterval);
      const intervalId = setInterval(() => {
        document.querySelector(".last-votes .refresh-button").click();
      }, 30000);
      setProjectInterval(intervalId);
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
            if (err.code === 4001) {
              return alert.error("Sign Canceled!");
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
    if (!state.user.loggedIn) {
      return alert.error("You need the connect wallet!");
    }

    if (!project.selectedParticipant && project.selectedParticipant !== 0) {
      return alert.error("Please make o choice!");
    }

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

  const countDownRenderer = ({ hours, minutes, seconds, days }) => {
    const formatStr = (number) => {
      const toStr = String(number);
      return toStr.length === 1 ? `0${toStr}` : toStr;
    };
    // console.log(hours, days, formatStr(hours));
    return (
      <p>
        {formatStr(days)}:{formatStr(hours)}:{formatStr(minutes)}:
        {formatStr(seconds)}
      </p>
    );
  };

  const pieChartMemo = useMemo(() => {
    const totalTokenVoted = project.participants
      .map((p) => p.voteCount)
      .reduce((a, b) => BigNumber(a).plus(b).toFixed(), "0");

    if (totalTokenVoted == 0) {
      return <Header as="h3">There is No Vote</Header>;
    } else {
      return <Pie data={project.pieChartData} width={200} height={200} />;
    }
  }, [project.participants]);

  const renderVotingHeader = useMemo(() => {
    if (project.isVotingEnded || isUserAlreadyVoteThisProject) {
      return "Results";
    }
    if (project.isVotingStarted) {
      return "Vote This Project";
    }
    return "Voting didn't start yet";
  }, [project, isUserAlreadyVoteThisProject]);

  const renderCountDown = () => {
    if (project.isVotingEnded) {
      return (
        <>
          <span className="date-title">VOTING ENDED</span>
          <span className="date-content">
            <p>{moment(Number(project.end_date)).format("L hh:mm A")}</p>
          </span>
        </>
      );
    }

    if (project.isVotingStarted) {
      return (
        <>
          <span className="date-title">VOTING ENDS IN</span>
          <span className="date-content">
            <Countdown
              date={Number(project.end_date)}
              renderer={countDownRenderer}
              onComplete={() => {
                setTimeout(() => getProject(), 1000);
              }}
            />
          </span>
        </>
      );
    }

    return (
      <>
        <span className="date-title">VOTING STARTS IN</span>
        <span className="date-content">
          <Countdown
            date={Number(project.start_date)}
            renderer={countDownRenderer}
            onComplete={() => {
              setTimeout(() => getProject(), 1000);
            }}
          />
        </span>
      </>
    );
  };

  return (
    <div className="detail-page">
      {project.loading ? (
        <Dimmer active inverted>
          <Loader size="medium">Loading</Loader>
        </Dimmer>
      ) : (
        <>
          <div className="detail">
            <Header as="h1" className="detail-title">
              {project.name}
            </Header>
            <Divider />
            <div className="detail-description">
              <EditorView description={project.description} />
            </div>
          </div>
          <div className="options-wrapper">
            <Header as="h3" className="options-title">
              {renderVotingHeader}
            </Header>
            {project.participants.length > 0 ? (
              <>
                {project.participants.map((p, index) => {
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
                          {isUserAlreadyVoteThisProject ||
                          project.isVotingEnded ||
                          !project.isVotingStarted ? null : (
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
                            width: `${p.votePercentage}%`,
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
                {isUserAlreadyVoteThisProject ||
                project.isVotingEnded ||
                !project.isVotingStarted ? null : (
                  <div className="submit-vote-row">
                    <Button onClick={onClickVoteBtn} primary>
                      Submit
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Header as="h4">
                There is no participant for this project yet
              </Header>
            )}
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
                onClick={getProject}
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
                        <Divider />
                        <p>{`Have ${numeral(voted.tokenHave).format(
                          "0,0.00000"
                        )} ETB Tokens`}</p>
                      </Feed.Content>
                    </animated.div>
                  );
                })}
              </Feed>
            ) : (
              <Header as="h4">No one vote this project yet</Header>
            )}
          </div>
          <div
            className={clsx({
              "detail-page-right": true,
              hide: hideRightSide,
            })}
          >
            <div className="chart">{pieChartMemo}</div>
            <div className="dates">
              <div className="date">{renderCountDown()}</div>
            </div>
            <div
              className="show-hide-trigger"
              onClick={() => setHideRightSide(!hideRightSide)}
            >
              <svg viewBox="0 0 512.002 512.002">
                <path d="M388.425 241.951L151.609 5.79c-7.759-7.733-20.321-7.72-28.067.04-7.74 7.759-7.72 20.328.04 28.067l222.72 222.105-222.728 222.104c-7.759 7.74-7.779 20.301-.04 28.061a19.8 19.8 0 0014.057 5.835 19.79 19.79 0 0014.017-5.795l236.817-236.155c3.737-3.718 5.834-8.778 5.834-14.05s-2.103-10.326-5.834-14.051z" />
              </svg>
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
