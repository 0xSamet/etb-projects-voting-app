import { Button, Divider, Header, Radio, Segment } from "semantic-ui-react";
import { Pie } from "react-chartjs-2";

const data = {
  labels: ["Team 1", "Team 2", "Team 3", "Team 4", "Team 5", "Team 6"],
  datasets: [
    {
      label: "# of Votes",

      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: [
        "rgba(255, 99, 132, 0.2)",
        "rgba(54, 162, 235, 0.2)",
        "rgba(255, 206, 86, 0.2)",
        "rgba(75, 192, 192, 0.2)",
        "rgba(153, 102, 255, 0.2)",
        "rgba(255, 159, 64, 0.2)",
      ],
      borderColor: [
        "rgba(255, 99, 132, 1)",
        "rgba(54, 162, 235, 1)",
        "rgba(255, 206, 86, 1)",
        "rgba(75, 192, 192, 1)",
        "rgba(153, 102, 255, 1)",
        "rgba(255, 159, 64, 1)",
      ],
      borderWidth: 1,
    },
  ],
};
export default function Home() {
  return (
    <div className="project-page">
      <div className="project-detail">
        <Header as="h1" className="projects-title" textAlign="center">
          Project 1
        </Header>
        <Divider />
        <p>
          Lorem Ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry's standard dummy text ever
          since the 1500s, when an unknown printer took a galley of type and
          scrambled it to make a type specimen book. It has survived not only
          five centuries, but also the leap into electronic typesetting,
          remaining essentially unchanged. It was popularised in the 1960s with
          the release of Letraset sheets containing Lorem Ipsum passages, and
          more recently with desktop publishing software like Aldus PageMaker
          including versions of Lorem Ipsum. Lorem Ipsum is simply dummy text of
          the printing and typesetting industry. Lorem Ipsum has been the
          industry's standard dummy text ever since the 1500s, when an unknown
          printer took a galley of type and scrambled it to make a type specimen
          book. It has survived not only five centuries, but also the leap into
          electronic typesetting, remaining essentially unchanged. It was
          popularised in the 1960s with the release of Letraset sheets
          containing Lorem Ipsum passages, and more recently with desktop
          publishing software like Aldus PageMaker including versions of Lorem
          Ipsum. Lorem Ipsum is simply dummy text of the printing and
          typesetting industry. Lorem Ipsum has been the industry's standard
          dummy text ever since the 1500s, when an unknown printer took a galley
          of type and scrambled it to make a type specimen book. It has survived
          not only five centuries, but also the leap into electronic
          typesetting, remaining essentially unchanged. It was popularised in
          the 1960s with the release of Letraset sheets containing Lorem Ipsum
          passages, and more recently with desktop publishing software like
          Aldus PageMaker including versions of Lorem Ipsum. Lorem Ipsum is
          simply dummy text of the printing and typesetting industry. Lorem
          Ipsum has been the industry's standard dummy text ever since the
          1500s, when an unknown printer took a galley of type and scrambled it
          to make a type specimen book. It has survived not only five centuries,
          but also the leap into electronic typesetting, remaining essentially
          unchanged. It was popularised in the 1960s with the release of
          Letraset sheets containing Lorem Ipsum passages, and more recently
          with desktop publishing software like Aldus PageMaker including
          versions of Lorem Ipsum.
        </p>
      </div>
      <div className="options-wrapper">
        <Header as="h3" className="options-title">
          Vote For Project
        </Header>
        <div className="option">
          <Segment compact>
            <div className="option-left">
              <Radio checked={false} />
            </div>
            <div className="option-right">
              <div className="option-right-top">
                <span className="bolder">Author: </span>
                <span>Samet Atasever</span>
              </div>
              <div className="option-right-bottom">
                <span className="bolder">Source: </span>
                <span>https://github.com/sametatasever/react-blog</span>
              </div>
            </div>
          </Segment>
        </div>
        <div className="option">
          <Segment compact>
            <div className="option-left">
              <Radio checked={false} />
            </div>
            <div className="option-right">
              <div className="option-right-top">
                <span className="bolder">Author: </span>
                <span>Samet Atasever</span>
              </div>
              <div className="option-right-bottom">
                <span className="bolder">Source: </span>
                <span>https://github.com/sametatasever/react-blog</span>
              </div>
            </div>
          </Segment>
        </div>
        <div className="option">
          <Segment compact>
            <div className="option-left">
              <Radio checked={false} />
            </div>
            <div className="option-right">
              <div className="option-right-top">
                <span className="bolder">Author: </span>
                <span>Samet Atasever</span>
              </div>
              <div className="option-right-bottom">
                <span className="bolder">Source: </span>
                <span>https://github.com/sametatasever/react-blog</span>
              </div>
            </div>
          </Segment>
        </div>
        <div className="submit-vote-row">
          <Button primary>Submit</Button>
        </div>
      </div>
      <div className="chart-wrapper-outside">
        <div className="chart-wrapper-inside">
          <Pie data={data} />
        </div>
      </div>
    </div>
  );
}
