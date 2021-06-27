import Head from "next/head";
import Link from "next/link";
import { Button, Divider, Header, Icon, Grid } from "semantic-ui-react";

export default function Home() {
  return (
    <div className="homepage">
      <Header as="h1" className="projects-title" textAlign="center">
        PROJECTS
      </Header>
      <Divider />
      <Grid className="projects" columns="equal" padded>
        <Grid.Column width={8}>
          <div className="project">
            <div className="card-left">
              <Header as="h4" className="project-title">
                Project 1
              </Header>
              <p className="project-description">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry. Lorem Ipsum has been the industry's standard dummy
                text ever since the 1500s, when an unknown printer took a galley
                of type and scrambled it to make a type specimen book. It has
                survived not only five centuries, but also the leap into
                electronic typesetting, remaining essentially unchanged. It was
                popularised in the 1960s with the release of Letraset sheets
                containing Lorem Ipsum passages, and more recently with desktop
                publishing software like Aldus PageMaker including versions of
                Lorem Ipsum.
              </p>
            </div>
            <div className="card-right">
              <div className="card-right-top">
                <Link href="/projects/1">
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
                    <p>30.06.2021</p>
                  </div>
                  <div className="project-button-right">
                    <h5>END </h5>
                    <p>30.07.2021</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Grid.Column>
        <Grid.Column width={8}>
          <div className="project">
            <div className="card-left">
              <Header as="h4" className="project-title">
                Project 2
              </Header>
              <p className="project-description">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry. Lorem Ipsum has been the industry's standard dummy
                text ever since the 1500s, when an unknown printer took a galley
                of type and scrambled it to make a type specimen book. It has
                survived not only five centuries, but also the leap into
                electronic typesetting, remaining essentially unchanged. It was
                popularised in the 1960s with the release of Letraset sheets
                containing Lorem Ipsum passages, and more recently with desktop
                publishing software like Aldus PageMaker including versions of
                Lorem Ipsum.
              </p>
            </div>
            <div className="card-right">
              <div className="card-right-top">
                <Link href="/projects/1">
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
                    <p>30.06.2021</p>
                  </div>
                  <div className="project-button-right">
                    <h5>END </h5>
                    <p>30.07.2021</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Grid.Column>
        <Grid.Column width={8}>
          <div className="project">
            <div className="card-left">
              <Header as="h4" className="project-title">
                Project 3
              </Header>
              <p className="project-description">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry. Lorem Ipsum has been the industry's standard dummy
                text ever since the 1500s, when an unknown printer took a galley
                of type and scrambled it to make a type specimen book. It has
                survived not only five centuries, but also the leap into
                electronic typesetting, remaining essentially unchanged. It was
                popularised in the 1960s with the release of Letraset sheets
                containing Lorem Ipsum passages, and more recently with desktop
                publishing software like Aldus PageMaker including versions of
                Lorem Ipsum.
              </p>
            </div>
            <div className="card-right">
              <div className="card-right-top">
                <Link href="/projects/1">
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
                    <p>30.06.2021</p>
                  </div>
                  <div className="project-button-right">
                    <h5>END </h5>
                    <p>30.07.2021</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Grid.Column>
      </Grid>
    </div>
  );
}
