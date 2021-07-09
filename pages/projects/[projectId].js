import {
  Button,
  Dimmer,
  Divider,
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
    selectedParticipant: -1,
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

  useEffect(() => {
    walletConnect.on("connect", (error, payload) => {
      if (error) {
        return console.log(error.message);
      }
      const { accounts } = payload.params[0];
      return dispatch(
        userLoginSuccess({
          wallet: accounts[0],
          connectedWith: "wallet-connect",
        })
      );
    });

    walletConnect.on("session_update", (error, payload) => {
      if (error) {
        return console.log(error.message);
      }
      const { accounts } = payload.params[0];
      return dispatch(
        userLoginSuccess({
          wallet: accounts[0],
          connectedWith: "wallet-connect",
        })
      );
    });

    walletConnect.on("disconnect", (error, payload) => {
      if (error) {
        return console.log(error.message);
      }
      return dispatch(userLogout());
    });

    if (walletConnect.connected) {
      const { accounts } = walletConnect;
      return dispatch(
        userLoginSuccess({
          wallet: accounts[0],
          connectedWith: "wallet-connect",
        })
      );
    }
  }, []);

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
              ...response.data.project,
              loading: false,
              participants: participantsColorPropAdded,
              pieChartData: newPieChartData,
            });
          }
        } catch (e) {
          alert.error(e.message);
          if (e.response && e.response.data && e.response.data.message) {
            alert.error(e.response.data.message);
          }
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

    // Draft Message Parameters
    const message = JSON.stringify({
      message: "voted",
    });

    const msgParams = [
      convertUtf8ToHex(message), // Required
      state.user.wallet, // Required
    ];

    walletConnect // Sign personal message
      .signPersonalMessage(msgParams)
      .then((result) => {
        // Returns signature.
        console.log(result);

        const a = recoverPersonalSignature({
          data: convertUtf8ToHex(message),
          sig: result,
        });
        console.log("recovered", a, state.user.wallet);
      })
      .catch((error) => {
        // Error returned when rejected
        console.error(error);
      });
  };

  useEffect(() => {
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

      walletConnectSign();
    }
  }, [modals[1].confirmed]);

  const voteProject = async () => {
    //find participant id by index
    let participantId;
    if (project.selectedParticipant || project.selectedParticipant === 0) {
      participantId = project.participants[project.selectedParticipant]._id;
    } else {
      return alert.error("Please select a participant!");
    }

    //confirm modals first
    if (!modals[1].confirmed && !modals[2].confirmed) {
      return setModals({
        ...modals,
        1: {
          show: true,
        },
      });
    }

    if (router.query && router.query.projectId) {
      try {
        const response = await axios.post(
          `/api/projects/${router.query.projectId}/vote`,
          {
            participantId,
          }
        );

        if (response && response.data && response.data.success) {
          alert.success("Success !");
        }
      } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
          return alert.error(e.response.data.message);
        }
        return alert.error(e.message);
      }
    } else {
      router.push("/");
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
          <div className="options-wrapper">
            <Header as="h3" className="options-title">
              Vote This Project
            </Header>
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
                  </Segment>
                </div>
              );
            })}
            <div className="submit-vote-row">
              <Button onClick={voteProject} primary>
                Submit
              </Button>
            </div>
            <div
              className={clsx({
                "vote-need-login-wrapper": true,
                active: !state.user.loggedIn,
              })}
            >
              <div className="message-box">
                <Header as="h3">You need the connect wallet to vote</Header>
              </div>
            </div>
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
          <Modal
            open={modals[2].show}
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
