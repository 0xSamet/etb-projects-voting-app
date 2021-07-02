import Head from "next/head";
import Link from "next/link";
import {
  Button,
  Divider,
  Header,
  Icon,
  Grid,
  Table,
  Dimmer,
  Loader,
  Segment,
} from "semantic-ui-react";
import AdminLoginRegisterForm from "../../components/admin/LoginRegisterForm";
import { useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAlert } from "react-alert";
import { adminLoginSuccess, wrapper } from "../../store";
import cookie from "cookie";

export default function AdminHome() {
  const state = useSelector((state) => state);
  const [projects, setProjects] = useState({
    loading: true,
    data: [],
  });
  const alert = useAlert();

  useEffect(() => {
    if (state.admin.loggedIn) {
      getProjects();
    }
  }, [state.admin.loggedIn]);

  const getProjects = async () => {
    try {
      setProjects({
        loading: true,
        data: [],
      });
      const response = await axios("/api/projects");

      if (response && response.data && response.data.projects) {
        setProjects({
          loading: false,
          data: response.data.projects.sort(
            (a, b) => a.sort_order - b.sort_order
          ),
        });
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.message) {
        setProjects({
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
          loading: false,
        });
        alert.error(e.response.data.message);
      }
    }
  };

  const renderProjects = useMemo(() => {
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
      return projects.data.map((project) => {
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
  return (
    <div className="admin-homepage">
      {state.admin.loggedIn ? (
        <>
          <Table
            celled
            compact
            className="admin-results-table admin-results-table-top"
          >
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell colSpan="3" textAlign="right">
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
                <Table.HeaderCell>Projects</Table.HeaderCell>
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
                  {/* <Menu floated="right" pagination>
                  <Menu.Item as="a" icon>
                    <Icon name="chevron left" />
                  </Menu.Item>
                  <Menu.Item as="a">1</Menu.Item>
                  <Menu.Item as="a">2</Menu.Item>
                  <Menu.Item as="a">3</Menu.Item>
                  <Menu.Item as="a">4</Menu.Item>
                  <Menu.Item as="a" icon>
                    <Icon name="chevron right" />
                  </Menu.Item>
                </Menu> */}
                  {"Pagination yapılacak"}
                </Table.HeaderCell>
              </Table.Row>
            </Table.Footer>
          </Table>
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
