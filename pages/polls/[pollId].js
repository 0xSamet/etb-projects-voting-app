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
import { useWalletConnect } from "../../lib/walletConnect";
import { convertUtf8ToHex } from "@walletconnect/utils";
import { userLoginSuccess, userLogout } from "../../store";
import { recoverPersonalSignature } from "eth-sig-util";
import { useSpring, useSprings, animated } from "react-spring";
import moment from "moment";
import BigNumber from "bignumber.js";
import Countdown from "react-countdown";
import numeral from "numeral";
import useWindowSize from "../../hooks/useWindowSize";

export default function PollDetail() {
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
  const [poll, setPoll] = useState({
    loading: true,
    name: "",
    description: "",
    start_date: new Date(),
    end_date: new Date(),
    proposals: [],
    pieChartData: { ...emptyPieChartData },
    selectedProposal: null,
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
  const [isUserAlreadyVoteThisPoll, setIsUserAlreadyVoteThisPoll] = useState(
    false
  );
  const [alreadyVotedLoading, setAlreadyVotedLoading] = useState(false);
  const [hideRightSide, setHideRightSide] = useState(false);
  const [pollInterval, setPollInterval] = useState(null);
  const state = useSelector((state) => state);
  const { walletConnect } = useWalletConnect();
  const dispatch = useDispatch();
  const windowSize = useWindowSize();

  const lastVoteSprings = useSprings(
    poll.alreadyVoted.length,
    poll.alreadyVoted.map((person) => ({
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
    let updateInterval = pollInterval;

    return () => {
      clearInterval(updateInterval);
    };
  }, [pollInterval]);

  const checkUserAlreadyVoted = () => {
    if (state.user.loggedIn && poll) {
      let isUserAlreadyVoteThisPoll = false;
      if (state.user.loggedIn) {
        const tryFind = poll.alreadyVoted.find(
          (vote) => vote.wallet === state.user.wallet.toLocaleLowerCase()
        );
        if (tryFind) {
          isUserAlreadyVoteThisPoll = tryFind.proposalId;
        }
        setIsUserAlreadyVoteThisPoll(isUserAlreadyVoteThisPoll);
      }
    } else {
      setIsUserAlreadyVoteThisPoll(false);
    }
  };

  const getPoll = async () => {
    if (router.query.pollId) {
      try {
        setAlreadyVotedLoading(true);
        const response = await axios(`/api/polls/${router.query.pollId}`);
        updatePollWithTheGivenPoll(response);
      } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
          return alert.error(e.response.data.message);
        }
        return alert.error(e.message);
      }
    }
  };

  const updatePollWithTheGivenPoll = (response) => {
    try {
      if (response && response.data && response.data.poll) {
        let proposalsUpdate = response.data.poll.proposals;

        proposalsUpdate = proposalsUpdate.map((p) => {
          const proposalId = p._id;
          const tryFind = poll.proposals.find((c) => c._id === proposalId);
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

        const totalTokenVoted = response.data.poll.proposals
          .map((p) => p.voteCount)
          .reduce((a, b) => BigNumber(a).plus(b).toFixed(), "0");

        if (totalTokenVoted == 0) {
          proposalsUpdate = proposalsUpdate.map((p) => {
            return {
              ...p,
              votePercentage: "0",
            };
          });
        } else {
          proposalsUpdate = proposalsUpdate.map((p) => {
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
        const startDate = response.data.poll.start_date;
        const endDate = response.data.poll.end_date;

        setPoll({
          ...poll,
          ...response.data.poll,
          loading: false,
          proposals: proposalsUpdate,
          pieChartData: {
            ...emptyPieChartData,
            // labels: proposalsUpdate.map((p) => p.text),
            datasets: [
              {
                ...emptyPieChartData.datasets[0],
                data: proposalsUpdate.map((p) => Number(p.voteCount)),
                backgroundColor: proposalsUpdate.map((p) => p.color.bg),
                borderColor: proposalsUpdate.map((p) => p.color.border),
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
  }, [state.user.loggedIn, poll]);

  useEffect(async () => {
    if (router.query.pollId) {
      try {
        clearInterval(pollInterval);
        const intervalId = setInterval(getPoll, 5000);
        setPollInterval(intervalId);
        const response = await axios(`/api/polls/${router.query.pollId}`);
        updatePollWithTheGivenPoll(response);
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
  }, [router.query.pollId]);

  const signAndUpdateState = async () => {
    if (!state.user.loggedIn) {
      await walletConnect.killSession();
      return dispatch(userLogout());
    }

    const messageToSign = JSON.stringify({
      pollId: router.query.pollId,
      proposalId: poll.proposals[poll.selectedProposal]._id,
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
            return setPoll({
              ...poll,
              walletConnectSign: {
                ...poll.walletConnectSign,
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
            return setPoll({
              ...poll,
              metamaskSign: {
                ...poll.metamaskSign,
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
    if (poll.walletConnectSign.signature) {
      if (router.query && router.query.pollId) {
        try {
          const response = await axios.post(
            `/api/polls/${router.query.pollId}/vote`,
            {
              signature: poll.walletConnectSign.signature,
              signedMessage: poll.walletConnectSign.signedMessage,
              wallet: state.user.wallet,
            }
          );

          updatePollWithTheGivenPoll(response);
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
          setPoll({
            ...poll,
            walletConnectSign: {
              ...poll.walletConnectSign,
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
  }, [poll.walletConnectSign.signature]);

  useEffect(async () => {
    if (poll.metamaskSign.signature) {
      if (router.query && router.query.pollId) {
        try {
          const response = await axios.post(
            `/api/polls/${router.query.pollId}/vote`,
            {
              signature: poll.metamaskSign.signature,
              signedMessage: poll.metamaskSign.signedMessage,
              wallet: state.user.wallet,
            }
          );

          updatePollWithTheGivenPoll(response);
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
          setPoll({
            ...poll,
            metamaskSign: {
              ...poll.metamaskSign,
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
  }, [poll.metamaskSign.signature]);

  const onClickVoteBtn = async () => {
    if (!state.user.loggedIn) {
      return alert.error("You need the connect wallet!");
    }

    if (!poll.selectedProposal && poll.selectedProposal !== 0) {
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

  const renderCountDown = () => {
    if (poll.isVotingEnded) {
      return (
        <>
          <span className="date-title">VOTING ENDED</span>
          <span className="date-content">
            <p>{moment(Number(poll.end_date)).format("L hh:mm A")}</p>
          </span>
        </>
      );
    }

    if (poll.isVotingStarted) {
      return (
        <>
          <span className="date-title">VOTING ENDS IN</span>
          <span className="date-content">
            <Countdown
              date={Number(poll.end_date)}
              renderer={countDownRenderer}
              onComplete={() => getPoll()}
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
            date={Number(poll.start_date)}
            renderer={countDownRenderer}
            onComplete={() => getPoll()}
          />
        </span>
      </>
    );
  };

  const pieChartMemo = useMemo(() => {
    const totalTokenVoted = poll.proposals
      .map((p) => p.voteCount)
      .reduce((a, b) => BigNumber(a).plus(b).toFixed(), "0");

    if (totalTokenVoted == 0) {
      return <Header as="h3">There is No Vote</Header>;
    } else {
      return <Pie data={poll.pieChartData} width={200} height={200} />;
    }
  }, [poll.proposals]);

  const renderVotingHeader = useMemo(() => {
    if (poll.isVotingEnded || isUserAlreadyVoteThisPoll) {
      return "Results";
    }
    if (poll.isVotingStarted) {
      return "Vote This Poll";
    }
    return "Voting didn't start yet";
  }, [poll, isUserAlreadyVoteThisPoll]);

  return (
    <div className="detail-page">
      {poll.loading ? (
        <Dimmer active inverted>
          <Loader size="medium">Loading</Loader>
        </Dimmer>
      ) : (
        <>
          <div className="detail">
            <Header as="h1" className="detail-title">
              {poll.name}
            </Header>
            <Divider />
            <div className="detail-description">
              <EditorView description={poll.description} />
            </div>
          </div>
          <div className="options-wrapper">
            <Header as="h3" className="options-title">
              {renderVotingHeader}
            </Header>
            {poll.proposals.length > 0 ? (
              <>
                {poll.proposals.map((p, index) => {
                  return (
                    <div
                      className="option"
                      key={p._id}
                      onClick={() =>
                        setPoll({ ...poll, selectedProposal: index })
                      }
                    >
                      <Segment
                        compact
                        style={{
                          borderColor: p.color.border,
                        }}
                      >
                        <div className="option-left">
                          {isUserAlreadyVoteThisPoll ||
                          poll.isVotingEnded ||
                          !poll.isVotingStarted ? null : (
                            <Radio checked={poll.selectedProposal === index} />
                          )}
                        </div>
                        <div className="option-right">
                          <span>{p.text}</span>
                        </div>
                        <div
                          className="option-bg"
                          style={{
                            background: p.color.bg,
                            width: `${p.votePercentage}%`,
                          }}
                        ></div>
                        <div className="option-votePercent">{`${p.votePercentage}%`}</div>
                        {isUserAlreadyVoteThisPoll &&
                          isUserAlreadyVoteThisPoll == p._id && (
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
                {isUserAlreadyVoteThisPoll ||
                poll.isVotingEnded ||
                !poll.isVotingStarted ? null : (
                  <div className="submit-vote-row">
                    <Button onClick={onClickVoteBtn} primary>
                      Submit
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Header as="h4">No proposals found for this poll yet</Header>
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
                onClick={getPoll}
              >
                <Icon size="tiny" name="refresh" />
              </Button>
            </Header>

            {lastVoteSprings.length > 0 ? (
              <Feed>
                {lastVoteSprings.map((styles, i, b) => {
                  const voted = poll.alreadyVoted[i];
                  const findProposal = poll.proposals.find(
                    (p) => p._id === voted.proposalId
                  );
                  const dateFormat = moment(Number(voted.vote_date)).fromNow();

                  return (
                    <animated.div
                      scrollTop={0}
                      className="ui event"
                      style={{
                        ...styles,
                        backgroundColor: findProposal.color.bg,
                      }}
                      key={"vote-key-" + i}
                    >
                      <Feed.Content
                      // style={{
                      //   backgroundColor: findProposal.color.bg,
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
              <Header as="h4">No one vote this poll yet</Header>
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
