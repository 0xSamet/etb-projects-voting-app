import {
  Button,
  Dimmer,
  Divider,
  Header,
  Loader,
  Radio,
  Segment,
} from "semantic-ui-react";
import { Pie } from "react-chartjs-2";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { EditorState } from "draft-js";
import axios from "axios";
import EditorView from "../../components/EditorView";
import randomColor from "randomcolor";
import { useAlert } from "react-alert";
import { useSelector } from "react-redux";
import clsx from "clsx";

export default function ProjectDetail() {
  const router = useRouter();
  const alert = useAlert();
  const [emptyPieChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1,
      },
    ],
  });
  const [project, setProject] = useState({
    loading: true,
    name: "",
    description: "",
    start_date: new Date(),
    end_date: new Date(),
    participants: [],
    pieChartData: { ...emptyPieChartData },
    selectedParticipant: -1,
  });
  const state = useSelector((state) => state);

  useEffect(() => {
    if (router.query.projectId) {
      const getProject = async () => {
        try {
          const response = await axios(
            `/api/projects/${router.query.projectId}`
          );
          if (response && response.data && response.data.project) {
            const participantsColorPropAdded = response.data.project.participants.map(
              (p) => {
                const borderColor = randomColor({ format: "rgba", alpha: 1 });
                const bgColor =
                  borderColor.substr(0, borderColor.length - 2) + "0.2)";
                // const borderColor =
                return {
                  ...p,
                  color: {
                    bg: bgColor,
                    border: borderColor,
                  },
                };
              }
            );

            const newPieChartData = { ...emptyPieChartData };
            participantsColorPropAdded.forEach((p) => {
              newPieChartData.labels.push(p.author);
              newPieChartData.datasets[0].data.push(p.voteCount);
              newPieChartData.datasets[0].backgroundColor.push(p.color.bg);
              newPieChartData.datasets[0].borderColor.push(p.color.border);
            });

            setProject({
              ...response.data.project,
              loading: false,
              participants: participantsColorPropAdded,
              pieChartData: newPieChartData,
            });
          }
        } catch (e) {
          alert.error(e.message);
          if (e.response && e.response.data && e.response.data.message) {
            alert.error(e.response.data.message);
          }
        }
      };
      getProject();
    }
  }, [router.query.projectId]);

  const pieChartMemo = useMemo(() => <Pie data={project.pieChartData} />, []);

  return (
    <div className="project-page">
      {project.loading ? (
        <Dimmer active inverted>
          <Loader size="medium">Loading</Loader>
        </Dimmer>
      ) : (
        <>
          <div className="project-detail">
            <Header as="h1" className="projects-title" textAlign="center">
              {project.name}
            </Header>
            <Divider />
            <div className="project-description">
              <EditorView description={project.description} />
            </div>
          </div>
          <div className="options-wrapper">
            <Header as="h3" className="options-title">
              Vote For Project
            </Header>
            {project.participants.map((p, index) => {
              return (
                <div
                  className="option"
                  key={p._id}
                  onClick={() =>
                    setProject({ ...project, selectedParticipant: index })
                  }
                >
                  <Segment
                    compact
                    style={{
                      borderColor: p.color.border,
                    }}
                  >
                    <div className="option-left">
                      <Radio checked={project.selectedParticipant === index} />
                    </div>
                    <div className="option-right">
                      <div className="option-right-top">
                        <span className="bolder">Author: </span>
                        <span>{p.author}</span>
                      </div>
                      <div className="option-right-bottom">
                        <span className="bolder">Source: </span>
                        <span>{p.source}</span>
                      </div>
                    </div>
                    <div
                      className="option-bg"
                      style={{
                        background: p.color.bg,
                        width: `${p.voteCount}%`,
                      }}
                    ></div>
                    <div className="option-votePercent">{`${p.voteCount}%`}</div>
                  </Segment>
                </div>
              );
            })}
            <div className="submit-vote-row">
              <Button primary>Submit</Button>
            </div>
            <div
              className={clsx({
                "vote-need-login-wrapper": true,
                active: !state.user.loggedIn,
              })}
            >
              <div className="message-box">
                <Header as="h3">You need the connect wallet to vote</Header>
              </div>
            </div>
          </div>
          <div className="chart-wrapper-outside">
            <div className="chart-wrapper-inside">{pieChartMemo}</div>
          </div>
        </>
      )}
    </div>
  );
}
