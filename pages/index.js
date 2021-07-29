import Head from "next/head";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import {
  Button,
  Divider,
  Header,
  Icon,
  Grid,
  Dimmer,
  Loader,
  Pagination,
} from "semantic-ui-react";
import axios from "axios";
import { useAlert } from "react-alert";
import EditorView from "../components/EditorView";
import { convertFromRaw, Editor, EditorState } from "draft-js";
import { userLoginSuccess, userLogout } from "../store";
import { useWalletConnect } from "../lib/walletConnect";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import clsx from "clsx";
import { animated, useSpring } from "react-spring";
import produce from "immer";
import moment from "moment";
import numeral from "numeral";
import Countdown from "react-countdown";
import useWindowSize from "../hooks/useWindowSize";

export default function Home() {
  const [state, setState] = useState({
    projects: {
      loading: true,
      data: [],
      pagination: {
        currentPage: 1,
        projectsPerPage: 6,
      },
      playAnimation: false,
    },
    polls: {
      loading: true,
      data: [],
      pagination: {
        currentPage: 1,
        pollsPerPage: 5,
      },
      playAnimation: false,
    },
  });
  const [initialRenderCompleted, setInitialRenderCompleted] = useState(false);
  const alert = useAlert();
  const { walletConnect } = useWalletConnect();
  const dispatch = useDispatch();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const windowSize = useWindowSize();

  const projectStyles = useSpring({
    from: { x: -100, opacity: 0 },
    to: { x: 0, opacity: 1 },
    reset: state.projects.playAnimation,
  });
  const pollStyles = useSpring({
    from: { x: 100, opacity: 0 },
    to: { x: 0, opacity: 1 },
    reset: state.polls.playAnimation,
  });

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

    getProjects();
  }, []);

  useEffect(() => {
    if (state.projects.loading || state.polls.loading) {
      return false;
    }
    if (activeTab === 0) {
      setState({
        ...state,
        projects: {
          ...state.projects,
          playAnimation: true,
        },
      });
    }
    if (activeTab === 1) {
      setState({
        ...state,
        polls: {
          ...state.polls,
          playAnimation: true,
        },
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (!state.projects.loading && !initialRenderCompleted) {
      getPolls();
      setInitialRenderCompleted(true);
    }
  }, [state.projects.loading]);

  const getProjects = async () => {
    try {
      setState({
        ...state,
        projects: {
          ...state.projects,
          loading: true,
          data: [],
          playAnimation: true,
        },
      });

      const response = await axios("/api/projects");

      if (response && response.data && response.data.projects) {
        setState({
          ...state,
          projects: {
            ...state.projects,
            loading: false,
            data: response.data.projects
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((project, i) => {
                const currentDate = new Date().getTime();
                const isVotingStarted = currentDate - project.start_date > 0;
                const isVotingEnded = project.end_date - currentDate < 0;

                return {
                  ...project,
                  isVotingStarted,
                  isVotingEnded,
                };
              }),
            playAnimation: true,
          },
        });
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.message) {
        setState({
          ...state,
          projects: {
            ...state.projects,
            loading: false,
          },
        });
        return alert.error(e.response.data.message);
      }
      return alert.error(e.message);
    }
  };

  const getPolls = async () => {
    try {
      setState({
        ...state,
        polls: {
          ...state.polls,
          loading: true,
          data: [],
          playAnimation: true,
        },
        projects: {
          ...state.projects,
          playAnimation: false,
        },
      });

      const response = await axios("/api/polls");

      if (response && response.data && response.data.polls) {
        setState({
          ...state,
          polls: {
            ...state.polls,
            loading: false,
            data: response.data.polls
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((poll, i) => {
                const currentDate = new Date().getTime();
                const isVotingStarted = currentDate - poll.start_date > 0;
                const isVotingEnded = poll.end_date - currentDate < 0;

                return {
                  ...poll,
                  isVotingStarted,
                  isVotingEnded,
                };
              }),
            playAnimation: true,
          },
          projects: {
            ...state.projects,
            playAnimation: false,
          },
        });
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.message) {
        setState({
          ...state,
          polls: {
            ...state.polls,
            loading: false,
          },
        });

        return alert.error(e.response.data.message);
      }
      console.log("error", e);
      return alert.error(e.message);
    }
  };

  const renderProjects = useMemo(() => {
    const { currentPage, projectsPerPage } = state.projects.pagination;
    const indexOfLastProject = currentPage * projectsPerPage;
    const indexOfFirstProject = indexOfLastProject - projectsPerPage;
    const currentProjects = state.projects.data.slice(
      indexOfFirstProject,
      indexOfLastProject
    );

    if (state.projects.loading) {
      return (
        <>
          <div style={{ minHeight: 500 }}></div>
          <Dimmer active inverted style={{ minHeight: 500 }}>
            <Loader size="medium">Loading</Loader>
          </Dimmer>
        </>
      );
    }
    if (state.projects.data && state.projects.data.length === 0) {
      return (
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            padding: 50,
          }}
        >
          <Header>There is no project</Header>
        </div>
      );
    }

    const renderer = ({ hours, minutes, seconds, days }) => {
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

    if (state.projects.data && state.projects.data.length > 0) {
      return currentProjects.map((project, projectIndex) => {
        let topButtonText = "";
        let topButtonIcon = <Icon name="chart pie" />;
        let bottomButtonText = "";
        let countDown = null;
        let buttonWidth = 167.59;
        let shortDescription = project.short_description.slice(0, 599);

        if (project.isVotingEnded) {
          topButtonText = "RESULTS";
          bottomButtonText = "VOTING ENDED";
          countDown = (
            <p>{moment(Number(project.end_date)).format("L hh:mm A")}</p>
          );
        } else if (project.isVotingStarted) {
          topButtonText = "VOTE NOW";
          bottomButtonText = "VOTING ENDS IN";
          countDown = (
            <Countdown
              date={Number(project.end_date)}
              renderer={renderer}
              onComplete={() => getProjects()}
            />
          );
        } else {
          topButtonText = "REVIEW";
          bottomButtonText = "VOTING STARTS IN";
          countDown = (
            <Countdown
              date={Number(project.start_date)}
              renderer={renderer}
              onComplete={() => getProjects()}
            />
          );
          topButtonIcon = <Icon name="search" />;
        }

        if (windowSize.width < 600) {
          buttonWidth = "100%";
        }

        return (
          <Grid.Column mobile={16} tablet={16} computer={8} key={project._id}>
            <div className="project">
              <div className="card-left">
                <Header as="h4" className="project-title">
                  {project.name}
                </Header>
                <div className="project-description">
                  <p>
                    {shortDescription}
                    {shortDescription.length > 598 && (
                      <span className="read-more-wrapper">
                        <Link href={`/projects/${project._id}`}>
                          <a className="text">Read More...</a>
                        </Link>
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="card-right">
                <div className="card-right-top">
                  <Link href={`/projects/${project._id}`}>
                    <a style={{ width: "100%" }}>
                      <Button
                        icon
                        loading={false}
                        labelPosition="left"
                        style={{ width: buttonWidth }}
                        fluid
                      >
                        {topButtonIcon}
                        {topButtonText}
                      </Button>
                    </a>
                  </Link>
                </div>
                <div className="card-right-bottom">
                  <div
                    className="project-button"
                    style={{
                      width: buttonWidth,
                    }}
                  >
                    <h5>{bottomButtonText}</h5>
                    {countDown}
                  </div>
                </div>
              </div>
            </div>
          </Grid.Column>
        );
      });
    }
    return null;
  }, [state.projects, windowSize]);

  const getProjectsPaginationCount = useMemo(() => {
    if (state.projects.loading || state.projects.data.length === 0) {
      return 1;
    }
    const pageNumbers = [];
    for (
      let i = 1;
      i <=
      Math.ceil(
        state.projects.data.length / state.projects.pagination.projectsPerPage
      );
      i++
    ) {
      pageNumbers.push(i);
    }
    return pageNumbers.length;
  }, [state.projects]);

  const renderPolls = useMemo(() => {
    const { currentPage, pollsPerPage } = state.polls.pagination;
    const indexOfLastPoll = currentPage * pollsPerPage;
    const indexOfFirstPoll = indexOfLastPoll - pollsPerPage;
    const currentPolls = state.polls.data.slice(
      indexOfFirstPoll,
      indexOfLastPoll
    );

    if (state.polls.loading) {
      return (
        <>
          <div style={{ minHeight: 500 }}></div>
          <Dimmer active inverted style={{ minHeight: 500 }}>
            <Loader size="medium">Loading</Loader>
          </Dimmer>
        </>
      );
    }
    if (state.polls.data && state.polls.data.length === 0) {
      return (
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            padding: 50,
          }}
        >
          <Header>There is no poll</Header>
        </div>
      );
    }
    const renderer = ({ hours, minutes, seconds, days }) => {
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
    if (state.polls.data && state.polls.data.length > 0) {
      return currentPolls.map((poll, pollIndex) => {
        let topButtonText = "";
        let topButtonIcon = <Icon name="chart pie" />;
        let bottomButtonText = "";
        let countDown = null;
        let buttonWidth = 167.59;

        if (poll.isVotingEnded) {
          topButtonText = "RESULTS";
          bottomButtonText = "VOTING ENDED";
          countDown = (
            <p>{moment(Number(poll.end_date)).format("L hh:mm A")}</p>
          );
        } else if (poll.isVotingStarted) {
          topButtonText = "VOTE NOW";
          bottomButtonText = "VOTING ENDS IN";
          countDown = (
            <Countdown
              date={Number(poll.end_date)}
              renderer={renderer}
              onComplete={() => getPolls()}
            />
          );
        } else {
          topButtonText = "REVIEW";
          bottomButtonText = "VOTING STARTS IN";
          countDown = (
            <Countdown
              date={Number(poll.start_date)}
              renderer={renderer}
              onComplete={() => getPolls()}
            />
          );
          topButtonIcon = <Icon name="search" />;
        }

        if (windowSize.width < 600) {
          buttonWidth = "100%";
        }

        return (
          <Grid.Column width={16} key={poll._id}>
            <div className="poll">
              <div className="card-left">
                <Header as="h4" className="poll-title">
                  {poll.name}
                </Header>
              </div>
              <div className="card-right">
                <div className="card-right-top">
                  <Link href={`/polls/${poll._id}`}>
                    <a style={{ width: "100%" }}>
                      <Button
                        icon
                        loading={false}
                        labelPosition="left"
                        style={{ width: buttonWidth }}
                        fluid
                      >
                        {topButtonIcon}
                        {topButtonText}
                      </Button>
                    </a>
                  </Link>
                </div>
                <div className="card-right-bottom">
                  <div className="poll-button" style={{ width: buttonWidth }}>
                    <h5>{bottomButtonText}</h5>
                    {countDown}
                  </div>
                </div>
              </div>
            </div>
          </Grid.Column>
        );
      });
    }
    return null;
  }, [state.polls, windowSize]);

  const getPollsPaginationCount = useMemo(() => {
    if (state.polls.loading || state.polls.data.length === 0) {
      return 1;
    }

    const pageNumbers = [];
    for (
      let i = 1;
      i <=
      Math.ceil(state.polls.data.length / state.polls.pagination.pollsPerPage);
      i++
    ) {
      pageNumbers.push(i);
    }

    return pageNumbers.length;
  }, [state.polls]);

  return (
    <div className="homepage">
      <div className="tabs-options">
        <div
          onClick={() => {
            if (activeTab === 0 && !state.projects.loading) {
              return getProjects();
            }
            setActiveTab(0);
          }}
          className={clsx({
            "tabs-option": true,
            active: activeTab === 0,
          })}
        >
          <span>PROJECTS</span>
        </div>
        <div
          className={clsx({
            "tabs-option": true,
            active: activeTab === 1,
          })}
          onClick={() => {
            if (activeTab === 1 && !state.polls.loading) {
              return getPolls();
            }
            setActiveTab(1);
          }}
        >
          <span>POLLS</span>
        </div>
      </div>
      <Divider />
      {activeTab === 0 && (
        <>
          <animated.div
            className="ui padded equal width grid projects"
            style={projectStyles}
          >
            {renderProjects}
          </animated.div>
          <Divider />
          <div className="pagination">
            <Pagination
              activePage={state.projects.pagination.currentPage}
              onPageChange={(_, page) => {
                setState({
                  ...state,
                  projects: {
                    ...state.projects,
                    pagination: {
                      ...state.projects.pagination,
                      currentPage: page.activePage,
                    },
                  },
                });
              }}
              ellipsisItem={{
                content: <Icon name="ellipsis horizontal" />,
                icon: true,
              }}
              firstItem={{
                content: <Icon name="angle double left" />,
                icon: true,
              }}
              lastItem={{
                content: <Icon name="angle double right" />,
                icon: true,
              }}
              prevItem={{
                content: <Icon name="angle left" />,
                icon: true,
              }}
              nextItem={{
                content: <Icon name="angle right" />,
                icon: true,
              }}
              totalPages={getProjectsPaginationCount}
            />
          </div>
        </>
      )}
      {activeTab === 1 && (
        <>
          <animated.div
            className="ui padded equal width grid polls"
            style={pollStyles}
          >
            {renderPolls}
          </animated.div>
          <Divider />
          <div className="pagination">
            <Pagination
              activePage={state.polls.pagination.currentPage}
              onPageChange={(_, page) => {
                setState({
                  ...state,
                  polls: {
                    ...state.polls,
                    pagination: {
                      ...state.polls.pagination,
                      currentPage: page.activePage,
                    },
                  },
                });
              }}
              ellipsisItem={{
                content: <Icon name="ellipsis horizontal" />,
                icon: true,
              }}
              firstItem={{
                content: <Icon name="angle double left" />,
                icon: true,
              }}
              lastItem={{
                content: <Icon name="angle double right" />,
                icon: true,
              }}
              prevItem={{
                content: <Icon name="angle left" />,
                icon: true,
              }}
              nextItem={{
                content: <Icon name="angle right" />,
                icon: true,
              }}
              totalPages={getPollsPaginationCount}
            />
          </div>
        </>
      )}
    </div>
  );
}
