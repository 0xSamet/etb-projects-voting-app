import Link from "next/link";
import {
  Button,
  Divider,
  Header,
  Icon,
  Table,
  Dimmer,
  Loader,
  Pagination,
} from "semantic-ui-react";
import AdminLoginRegisterForm from "../../components/admin/LoginRegisterForm";
import { useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAlert } from "react-alert";
import { adminLoginSuccess, wrapper } from "../../store";
import clsx from "clsx";
import { animated, useSpring } from "react-spring";

export default function AdminHome() {
  const store = useSelector((store) => store);
  const [state, setState] = useState({
    projects: {
      loading: true,
      data: [],
      pagination: {
        currentPage: 1,
        projectsPerPage: 10,
      },
      playAnimation: false,
    },
    polls: {
      loading: true,
      data: [],
      pagination: {
        currentPage: 1,
        pollsPerPage: 10,
      },
      playAnimation: false,
    },
  });
  const [initialRenderCompleted, setInitialRenderCompleted] = useState(false);
  const alert = useAlert();
  const [activeTab, setActiveTab] = useState(0);
  const projectStyles = useSpring({
    from: { x: -100 },
    to: { x: 0 },
    reset: state.projects.playAnimation,
  });
  const pollStyles = useSpring({
    from: { x: 100 },
    to: { x: 0 },
    reset: state.polls.playAnimation,
  });

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
    if (store.admin.loggedIn) {
      getProjects();
    }
  }, [store.admin.loggedIn]);

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
        const { currentPage, projectsPerPage } = state.projects.pagination;

        const indexOfLastProject = currentPage * projectsPerPage;
        const indexOfFirstProject = indexOfLastProject - projectsPerPage;
        const currentProjects = response.data.projects.slice(
          indexOfFirstProject,
          indexOfLastProject
        );

        if (
          currentProjects.length === 0 &&
          state.projects.pagination.currentPage !== 1
        ) {
          return setState({
            ...state,
            projects: {
              ...state.projects,
              loading: false,
              data: response.data.projects.sort(
                (a, b) => a.sort_order - b.sort_order
              ),
              pagination: {
                ...state.projects.pagination,
                currentPage: state.projects.pagination.currentPage - 1,
              },
              playAnimation: true,
            },
          });
        }

        setState({
          ...state,
          projects: {
            ...state.projects,
            loading: false,
            data: response.data.projects.sort(
              (a, b) => a.sort_order - b.sort_order
            ),
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
        alert.error(e.response.data.message);
      }
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
        const { currentPage, pollsPerPage } = state.polls.pagination;

        const indexOfLastPoll = currentPage * pollsPerPage;
        const indexOfFirstPoll = indexOfLastPoll - pollsPerPage;
        const currentPolls = response.data.polls.slice(
          indexOfFirstPoll,
          indexOfLastPoll
        );

        if (
          currentPolls.length === 0 &&
          state.polls.pagination.currentPage !== 1
        ) {
          return setState({
            ...state,
            polls: {
              ...state.polls,
              loading: false,
              data: response.data.polls.sort(
                (a, b) => a.sort_order - b.sort_order
              ),
              pagination: {
                ...state.polls.pagination,
                currentPage: state.polls.pagination.currentPage - 1,
              },
              playAnimation: true,
            },
            projects: {
              ...state.projects,
              playAnimation: false,
            },
          });
        }

        setState({
          ...state,
          polls: {
            ...state.polls,
            loading: false,
            data: response.data.polls.sort(
              (a, b) => a.sort_order - b.sort_order
            ),
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
        alert.error(e.response.data.message);
      }
    }
  };

  const deleteProject = async (projectId) => {
    try {
      const response = await axios.delete(`/api/projects/${projectId}`);

      if (response && response.data && response.data.success) {
        getProjects();
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
        alert.error(e.response.data.message);
      }
    }
  };

  const deletePoll = async (pollId) => {
    try {
      const response = await axios.delete(`/api/polls/${pollId}`);

      if (response && response.data && response.data.success) {
        getPolls();
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
        alert.error(e.response.data.message);
      }
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
        <Dimmer active inverted style={{ background: "#fff", minHeight: 300 }}>
          <Loader size="medium">Loading</Loader>
        </Dimmer>
      );
    }
    if (state.projects.data && state.projects.data.length === 0) {
      return (
        <div style={{ padding: 15, textAlign: "center" }}>
          <Header>There is no project</Header>
        </div>
      );
    }
    if (state.projects.data && state.projects.data.length > 0) {
      return currentProjects.map((project) => {
        return (
          <Table.Row key={project._id}>
            <Table.Cell>{project.name}</Table.Cell>
            <Table.Cell textAlign="center">{project.sort_order}</Table.Cell>
            <Table.Cell singleLine>
              <Link href={`/admin/projects/edit/${project._id}`}>
                <a>
                  <Button icon labelPosition="left" size="tiny" color="teal">
                    <Icon name="edit" />
                    Edit
                  </Button>
                </a>
              </Link>
              <Button
                icon="trash"
                size="tiny"
                color="red"
                onClick={async () => await deleteProject(project._id)}
              ></Button>
            </Table.Cell>
          </Table.Row>
        );
      });
    }
    return null;
  }, [state.projects]);

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
        <Dimmer active inverted style={{ background: "#fff", minHeight: 300 }}>
          <Loader size="medium">Loading</Loader>
        </Dimmer>
      );
    }
    if (state.polls.data && state.polls.data.length === 0) {
      return (
        <div style={{ padding: 15, textAlign: "center" }}>
          <Header>There is no poll</Header>
        </div>
      );
    }
    if (state.polls.data && state.polls.data.length > 0) {
      return currentPolls.map((poll) => {
        return (
          <Table.Row key={poll._id}>
            <Table.Cell>{poll.name}</Table.Cell>
            <Table.Cell textAlign="center">{poll.sort_order}</Table.Cell>
            <Table.Cell singleLine>
              <Link href={`/admin/polls/edit/${poll._id}`}>
                <a>
                  <Button icon labelPosition="left" size="tiny" color="teal">
                    <Icon name="edit" />
                    Edit
                  </Button>
                </a>
              </Link>
              <Button
                icon="trash"
                size="tiny"
                color="red"
                onClick={async () => await deletePoll(poll._id)}
              ></Button>
            </Table.Cell>
          </Table.Row>
        );
      });
    }
    return null;
  }, [state.polls]);

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
    <div className="admin-homepage">
      {store.admin.loggedIn ? (
        <>
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
              className={clsx({
                "tabs-option": true,
                active: activeTab === 1,
              })}
            >
              <span>POLLS</span>
            </div>
          </div>
          <Divider />
          {activeTab === 0 && (
            <animated.div style={{ position: "relative", ...projectStyles }}>
              <Table celled compact className="admin-results-table-top">
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell
                      colSpan="3"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Header as="h4" style={{ margin: 0 }}>
                        Projects
                      </Header>
                      <Link href="/admin/projects/add">
                        <a>
                          <Button
                            icon
                            labelPosition="left"
                            size="tiny"
                            color="blue"
                          >
                            <Icon name="add square" />
                            Add Project
                          </Button>
                        </a>
                      </Link>
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
              </Table>
              <Table celled compact className="admin-results-table">
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Name</Table.HeaderCell>
                    <Table.HeaderCell collapsing textAlign="center">
                      Sort Order
                    </Table.HeaderCell>
                    <Table.HeaderCell
                      collapsing
                      textAlign="center"
                    ></Table.HeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>{renderProjects}</Table.Body>

                <Table.Footer>
                  <Table.Row>
                    <Table.HeaderCell colSpan="3" textAlign="right">
                      <Pagination
                        activePage={state.projects.pagination.currentPage}
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
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Footer>
              </Table>
            </animated.div>
          )}
          {activeTab === 1 && (
            <animated.div style={pollStyles}>
              <Table
                celled
                compact
                className="admin-results-table admin-results-table-top"
              >
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell
                      colSpan="3"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Header as="h4" style={{ margin: 0 }}>
                        Polls
                      </Header>
                      <Link href="/admin/polls/add">
                        <a>
                          <Button
                            icon
                            labelPosition="left"
                            size="tiny"
                            color="blue"
                          >
                            <Icon name="add square" />
                            Add Poll
                          </Button>
                        </a>
                      </Link>
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
              </Table>
              <Table celled compact className="admin-results-table">
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Name</Table.HeaderCell>
                    <Table.HeaderCell collapsing textAlign="center">
                      Sort Order
                    </Table.HeaderCell>
                    <Table.HeaderCell
                      collapsing
                      textAlign="center"
                    ></Table.HeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>{renderPolls}</Table.Body>

                <Table.Footer>
                  <Table.Row>
                    <Table.HeaderCell colSpan="3" textAlign="right">
                      <Pagination
                        activePage={state.polls.pagination.currentPage}
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
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Footer>
              </Table>
            </animated.div>
          )}
        </>
      ) : (
        <AdminLoginRegisterForm />
      )}
    </div>
  );
}

export const getServerSideProps = wrapper.getServerSideProps(
  (store) => async ({ req, res, ...etc }) => {
    try {
      const response = await axios.get(`${process.env.BASE_URL}/api/admin/me`, {
        headers: {
          cookie: req.headers.cookie,
        },
      });
      //console.log(response);

      if (response && response.data && response.data.success) {
        store.dispatch(adminLoginSuccess(response.data.username));
      }
    } catch (e) {
      console.log(e);
    }
  }
);
