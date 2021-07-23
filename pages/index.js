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
  const [projects, setProjects] = useState({
    loading: true,
    data: [],
    pagination: {
      currentPage: 1,
      projectsPerPage: 6,
    },
    playAnimation: false,
  });
  const [polls, setPolls] = useState({
    loading: true,
    data: [],
    pagination: {
      currentPage: 1,
      pollsPerPage: 5,
    },
    playAnimation: false,
  });

  const alert = useAlert();
  const { walletConnect } = useWalletConnect();
  const dispatch = useDispatch();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const windowSize = useWindowSize();

  const projectStyles = useSpring({
    from: { x: -100 },
    to: { x: 0 },
    reset: projects.playAnimation,
    onRest: () => {
      console.log("b");
      setProjects({
        ...projects,
        playAnimation: false,
      });
    },
  });
  const pollStyles = useSpring({
    from: { x: 100 },
    to: { x: 0 },
    reset: polls.playAnimation,
    onRest: () => {
      setPolls({
        ...polls,
        playAnimation: false,
      });
    },
  });

  useEffect(() => {
    if (activeTab === 0) {
      setProjects({
        ...projects,
        playAnimation: true,
      });
    } else {
      setPolls({
        ...polls,
        playAnimation: true,
      });
    }
  }, [activeTab]);

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
    getPolls();

    router.events.on("routeChangeComplete", getProjectsAndPollsOnIconClick);

    return () => {
      router.events.off("routeChangeComplete", getProjectsAndPollsOnIconClick);
    };
  }, []);

  const getProjectsAndPollsOnIconClick = (path) => {
    if (path === "/") {
      getProjects();
      return getPolls();
    }
  };

  const getProjects = async () => {
    try {
      setProjects({
        ...projects,
        loading: true,
        data: [],
      });
      const response = await axios("/api/projects");

      if (response && response.data && response.data.projects) {
        setProjects({
          ...projects,
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
        });
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.message) {
        setProjects({
          ...projects,
          loading: false,
        });
        return alert.error(e.response.data.message);
      }
      return alert.error(e.message);
    }
  };

  const getPolls = async () => {
    try {
      setPolls({
        ...polls,
        loading: true,
        data: [],
      });
      const response = await axios("/api/polls");

      if (response && response.data && response.data.polls) {
        setPolls({
          ...polls,
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
        });
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.message) {
        setPolls({
          ...polls,
          loading: false,
        });
        return alert.error(e.response.data.message);
      }
      return alert.error(e.message);
    }
  };

  const renderProjects = useMemo(() => {
    const { currentPage, projectsPerPage } = projects.pagination;
    const indexOfLastProject = currentPage * projectsPerPage;
    const indexOfFirstProject = indexOfLastProject - projectsPerPage;
    const currentProjects = projects.data.slice(
      indexOfFirstProject,
      indexOfLastProject
    );

    if (projects.loading) {
      return (
        <>
          <div style={{ minHeight: 500 }}></div>
          <Dimmer active inverted style={{ minHeight: 500 }}>
            <Loader size="medium">Loading</Loader>
          </Dimmer>
        </>
      );
    }
    if (projects.data && projects.data.length === 0) {
      return (
        <div style={{ padding: 15, textAlign: "center" }}>
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

    if (projects.data && projects.data.length > 0) {
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
          topButtonText = "GO TO VOTE";
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
                    {/* {project.short_description.length > 599 && (
                      <span className="read-more-wrapper">
                        <Link href={`/projects/${project._id}`}>
                          <a className="text">Read More...</a>
                        </Link>
                      </span>
                    )} */}
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
  }, [projects, windowSize]);

  const getProjectsPaginationCount = useMemo(() => {
    if (projects.loading) {
      return 1;
    }
    const pageNumbers = [];
    for (
      let i = 1;
      i <=
      Math.ceil(projects.data.length / projects.pagination.projectsPerPage);
      i++
    ) {
      pageNumbers.push(i);
    }
    return pageNumbers.length;
  }, [projects]);

  const renderPolls = useMemo(() => {
    if (polls.loading) {
      return (
        <>
          <div style={{ minHeight: 500 }}></div>
          <Dimmer active inverted style={{ minHeight: 500 }}>
            <Loader size="medium">Loading</Loader>
          </Dimmer>
        </>
      );
    }
    if (polls.data && polls.data.length === 0) {
      return (
        <div style={{ padding: 15, textAlign: "center" }}>
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
    if (polls.data && polls.data.length > 0) {
      return polls.data.map((poll, pollIndex) => {
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
          topButtonText = "GO TO VOTE";
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
        return (
          <Grid.Column width={16} key={poll._id}>
            <div className="poll">
              <div className="card-left">
                <Header as="h4" className="project-title">
                  {poll.name}
                </Header>
              </div>
              <div className="card-right">
                <div className="card-right-top">
                  <Link href={`/polls/${poll._id}`}>
                    <a>
                      <Button
                        icon
                        loading={false}
                        labelPosition="left"
                        style={{ width: buttonWidth }}
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
  }, [polls]);

  const getPollsPaginationCount = useMemo(() => {
    if (polls.loading) {
      return 1;
    }

    const pageNumbers = [];
    for (
      let i = 1;
      i <= Math.ceil(polls.data.length / polls.pagination.pollsPerPage);
      i++
    ) {
      pageNumbers.push(i);
    }

    return pageNumbers.length;
  }, [polls]);

  return (
    <div className="homepage">
      <div className="tabs-options">
        <div
          onClick={() => {
            if (activeTab === 0) {
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
            if (activeTab === 1) {
              return getPolls();
            }
            setActiveTab(1);
          }}
        >
          <span>POLLS</span>
        </div>
      </div>
      <Divider />
      {activeTab === 0 && !projects.loading && (
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
              activePage={projects.pagination.currentPage}
              onPageChange={(_, page) => {
                setProjects({
                  ...projects,
                  pagination: {
                    ...projects.pagination,
                    currentPage: page.activePage,
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
      {activeTab === 1 && !polls.loading && (
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
              activePage={polls.pagination.currentPage}
              onPageChange={(_, page) => {
                setPolls({
                  ...polls,
                  pagination: {
                    ...polls.pagination,
                    currentPage: page.activePage,
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
