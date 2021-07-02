import Head from "next/head";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { Button, Divider, Header, Icon, Grid } from "semantic-ui-react";
import axios from "axios";
import { useAlert } from "react-alert";
import EditorView from "../components/EditorView";
import { convertFromRaw, Editor, EditorState } from "draft-js";

export default function Home() {
  const [projects, setProjects] = useState({
    loading: true,
    data: [],
  });
  const alert = useAlert();

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
          data: response.data.projects.sort(
            (a, b) => a.sort_order - b.sort_order
          ),
        });
      }
    } catch (e) {
      alert.error(e.message);
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
      return <div>loading ...</div>;
    }
    if (projects.data && projects.data.length === 0) {
      return <div>proje yokki</div>;
    }
    if (projects.data && projects.data.length > 0) {
      return projects.data.map((project) => {
        return (
          <Grid.Column width={8} key={project._id}>
            <div className="project">
              <div className="card-left">
                <Header as="h4" className="project-title">
                  {project.name}
                </Header>
                <div className="project-description">
                  <EditorView description={project.description} />
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
