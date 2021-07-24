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
  const state = useSelector((state) => state);
  const [projects, setProjects] = useState({
    loading: true,
    data: [],
    pagination: {
      currentPage: 1,
      projectsPerPage: 10,
    },
    playAnimation: false,
  });
  const [polls, setPolls] = useState({
    loading: true,
    data: [],
    pagination: {
      currentPage: 1,
      pollsPerPage: 10,
    },
    playAnimation: false,
  });
  const alert = useAlert();
  const [activeTab, setActiveTab] = useState(0);
  const projectStyles = useSpring({
    from: { x: -100 },
    to: { x: 0 },
    reset: projects.playAnimation,
    onRest: () => {
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
    if (projects.loading || polls.loading) {
      return false;
    }
    if (activeTab === 0) {
      return setProjects({
        ...projects,
        playAnimation: true,
      });
    }
    if (activeTab === 1) {
      return setPolls({
        ...polls,
        playAnimation: true,
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (state.admin.loggedIn) {
      getProjects();
      getPolls();
    }
  }, [state.admin.loggedIn]);

  const getProjects = async () => {
    try {
      setProjects({
        ...projects,
        loading: true,
        data: [],
        playAnimation: false,
      });
      const response = await axios("/api/projects");

      if (response && response.data && response.data.projects) {
        const { currentPage, projectsPerPage } = projects.pagination;

        const indexOfLastProject = currentPage * projectsPerPage;
        const indexOfFirstProject = indexOfLastProject - projectsPerPage;
        const currentProjects = response.data.projects.slice(
          indexOfFirstProject,
          indexOfLastProject
        );

        if (
          currentProjects.length === 0 &&
          projects.pagination.currentPage !== 1
        ) {
          return setProjects({
            ...projects,
            pagination: {
              ...projects.pagination,
              currentPage: projects.pagination.currentPage - 1,
            },
            loading: false,
            data: response.data.projects.sort(
              (a, b) => a.sort_order - b.sort_order
            ),
            playAnimation: true,
          });
        }
        setProjects({
          ...projects,
          loading: false,
          data: response.data.projects.sort(
            (a, b) => a.sort_order - b.sort_order
          ),
          playAnimation: true,
        });
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.message) {
        setProjects({
          ...projects,
          loading: false,
        });
        alert.error(e.response.data.message);
      }
    }
  };

  const getPolls = async () => {
    try {
      setPolls({
        ...polls,
        loading: true,
        data: [],
        playAnimation: false,
      });
      const response = await axios("/api/polls");

      if (response && response.data && response.data.polls) {
        const { currentPage, pollsPerPage } = polls.pagination;

        const indexOfLastPoll = currentPage * pollsPerPage;
        const indexOfFirstPoll = indexOfLastPoll - pollsPerPage;
        const currentPolls = response.data.polls.slice(
          indexOfFirstPoll,
          indexOfLastPoll
        );

        if (currentPolls.length === 0 && polls.pagination.currentPage !== 1) {
          return setPolls({
            ...polls,
            loading: false,
            data: response.data.polls.sort(
              (a, b) => a.sort_order - b.sort_order
            ),
            pagination: {
              ...polls.pagination,
              currentPage: polls.pagination.currentPage - 1,
            },
            playAnimation: true,
          });
        }

        setPolls({
          ...polls,
          loading: false,
          data: response.data.polls.sort((a, b) => a.sort_order - b.sort_order),
          playAnimation: true,
        });
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.message) {
        setPolls({
          ...polls,
          loading: false,
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
        setProjects({
          ...projects,
          loading: false,
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
        setPolls({
          loading: false,
        });
        alert.error(e.response.data.message);
      }
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
        <Dimmer active inverted style={{ background: "#fff", minHeight: 300 }}>
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
  }, [projects]);

  const getProjectsPaginationCount = useMemo(() => {
    if (projects.loading || projects.data.length === 0) {
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
    const { currentPage, pollsPerPage } = polls.pagination;

    const indexOfLastPoll = currentPage * pollsPerPage;
    const indexOfFirstPoll = indexOfLastPoll - pollsPerPage;
    const currentPolls = polls.data.slice(indexOfFirstPoll, indexOfLastPoll);

    if (polls.loading) {
      return (
        <Dimmer active inverted style={{ background: "#fff", minHeight: 300 }}>
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
  }, [polls]);

  const getPollsPaginationCount = useMemo(() => {
    if (polls.loading || polls.data.length === 0) {
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
    <div className="admin-homepage">
      {state.admin.loggedIn ? (
        <>
          <div className="tabs-options">
            <div
              onClick={() => {
                if (activeTab === 0 && !projects.loading) {
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
                if (activeTab === 1 && !polls.loading) {
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
