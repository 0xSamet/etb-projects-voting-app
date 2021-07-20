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
import { useWalletConnectContext } from "../lib/walletConnectContext";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import clsx from "clsx";
import { animated, useSpring } from "react-spring";

export default function Home() {
  const [projects, setProjects] = useState({
    loading: true,
    data: [],
    pagination: {
      currentPage: 1,
      projectsPerPage: 6,
    },
  });
  const [polls, setPolls] = useState({
    loading: true,
    data: [],
    pagination: {
      currentPage: 1,
      pollsPerPage: 5,
    },
  });
  const alert = useAlert();
  const { walletConnect } = useWalletConnectContext();
  const dispatch = useDispatch();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);

  const projectStyles = useSpring({
    from: { x: -100 },
    to: { x: 0 },
    reset: true,
  });
  const pollStyles = useSpring({
    from: { x: 100 },
    to: { x: 0 },
    reset: true,
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
    getPolls();

    router.events.on("routeChangeComplete", getProjectsOnIconClick);

    return () => {
      router.events.off("routeChangeComplete", getProjectsOnIconClick);
    };
  }, []);

  const getProjectsOnIconClick = (path) => {
    if (path === "/") {
      return getProjects();
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
            .map((project) => {
              let formatDescription = project.short_description;

              if (formatDescription.length > 600) {
                formatDescription = formatDescription.substr(0, 600);
              }

              return {
                ...project,
                short_description: formatDescription,
              };
            }),
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
          data: response.data.polls.sort((a, b) => a.sort_order - b.sort_order),
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
        <Dimmer active inverted style={{ minHeight: 300 }}>
          <Loader size="medium">Loading</Loader>
        </Dimmer>
      );
    }
    if (projects.data && projects.data.length === 0) {
      return (
        <div style={{ padding: 15, textAlign: "center" }}>
          <Header>There is no project</Header>
        </div>
      );
    }
    if (projects.data && projects.data.length > 0) {
      return currentProjects.map((project) => {
        return (
          <Grid.Column width={8} key={project._id}>
            <div className="project">
              <div className="card-left">
                <Header as="h4" className="project-title">
                  {project.name}
                </Header>
                <div className="project-description">
                  <p>
                    {project.short_description}
                    {project.short_description.length > 599 && (
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
                    <a>
                      <Button icon loading={false} labelPosition="left">
                        <Icon name="chart pie" />
                        GO TO VOTE
                      </Button>
                    </a>
                  </Link>
                </div>
                <div className="card-right-bottom">
                  <div className="project-button">
                    <div className="project-button-left">
                      <h5>START </h5>
                      <p>
                        {new Date(
                          Number(project.start_date)
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="project-button-right">
                      <h5>END </h5>
                      <p>
                        {new Date(
                          Number(project.end_date)
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Grid.Column>
        );
      });
    }
    return null;
  }, [projects]);

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
        <Dimmer active inverted style={{ minHeight: 300 }}>
          <Loader size="medium">Loading</Loader>
        </Dimmer>
      );
    }
    if (polls.data && polls.data.length === 0) {
      return (
        <div style={{ padding: 15, textAlign: "center" }}>
          <Header>There is no poll</Header>
        </div>
      );
    }
    if (polls.data && polls.data.length > 0) {
      return polls.data.map((poll) => {
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
                      <Button icon loading={false} labelPosition="left">
                        <Icon name="chart pie" />
                        GO TO VOTE
                      </Button>
                    </a>
                  </Link>
                </div>
                <div className="card-right-bottom">
                  <div className="poll-button">
                    <div className="poll-button-left">
                      <h5>START </h5>
                      <p>
                        {new Date(Number(poll.start_date)).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="poll-button-right">
                      <h5>END </h5>
                      <p>
                        {new Date(Number(poll.end_date)).toLocaleDateString()}
                      </p>
                    </div>
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
            columns="equal"
            padded
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
            columns="equal"
            padded
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
