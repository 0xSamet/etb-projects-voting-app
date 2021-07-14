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
} from "semantic-ui-react";
import axios from "axios";
import { useAlert } from "react-alert";
import EditorView from "../components/EditorView";
import { convertFromRaw, Editor, EditorState } from "draft-js";
import { userLoginSuccess, userLogout } from "../store";
import { useWalletConnectContext } from "../lib/walletConnectContext";
import { useDispatch } from "react-redux";

export default function Home() {
  const [projects, setProjects] = useState({
    loading: true,
    data: [],
  });
  const alert = useAlert();
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
    getProjects();
  }, []);

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
          loading: false,
        });
        return alert.error(e.response.data.message);
      }
      return alert.error(e.message);
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
          <Grid.Column width={8} key={project._id}>
            <div className="project">
              <div className="card-left">
                <Header as="h4" className="project-title">
                  {project.name}- {project.short_description.length}
                </Header>
                <div className="project-description">
                  <p>
                    {project.short_description}
                    {project.short_description.length > 599 && (
                      <p className="read-more-wrapper">
                        <Link href={`/projects/${project._id}`}>
                          <a className="text">Read More...</a>
                        </Link>
                      </p>
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
  return (
    <div className="homepage">
      <Header as="h1" className="projects-title" textAlign="center">
        PROJECTS
      </Header>
      <Divider />
      <Grid className="projects" columns="equal" padded>
        {renderProjects}
      </Grid>
    </div>
  );
}
