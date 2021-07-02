import Head from "next/head";
import Link from "next/link";
import {
  Button,
  Divider,
  Header,
  Icon,
  Grid,
  Table,
  Tab,
  Form,
  Segment,
  FormField,
  Loader,
  Dimmer,
} from "semantic-ui-react";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import Editor from "../../../../components/admin/Editor";
import produce from "immer";
import axios from "axios";
import { useRouter } from "next/router";
import { useAlert } from "react-alert";
import { EditorState, convertFromRaw, convertToRaw } from "draft-js";
import ReactDateTime from "react-datetime";

export default function AdminAddProject() {
  const state = useSelector((state) => state);
  const [projectInputs, setProjectInputs] = useState({
    loading: true,
    name: "",
    description: EditorState.createEmpty(),
    sort_order: 0,
    start_date: new Date(),
    end_date: new Date(),
    participants: [],
  });
  const router = useRouter();
  const alert = useAlert();

  useEffect(() => {
    if (router.query.projectId) {
      //console.log(router.query);
      const getProject = async () => {
        try {
          const response = await axios(
            `/api/projects/${router.query.projectId}`
          );

          if (response && response.data && response.data.project) {
            setProjectInputs({
              ...response.data.project,
              start_date: new Date(Number(response.data.project.start_date)),
              end_date: new Date(Number(response.data.project.end_date)),
              description: EditorState.createWithContent(
                convertFromRaw(JSON.parse(response.data.project.description))
              ),
            });
          }
        } catch (e) {
          if (e.response && e.response.data && e.response.data.message) {
            alert.error(e.response.data.message);
          }
        }
      };
      getProject();
    }
  }, [router.query.projectId]);

  const simpleInputChange = (e) => {
    return setProjectInputs({
      ...projectInputs,
      [e.target.name]: e.target.value,
    });
  };

  const addParticipant = (e) => {
    return setProjectInputs({
      ...projectInputs,
      participants: [
        ...projectInputs.participants,
        {
          _id: String(projectInputs.participants.length),
          author: "",
          source: "",
          newParticipant: true,
          deleted: false,
        },
      ],
    });
  };

  const submitForm = async () => {
    if (router.query && router.query.projectId) {
      try {
        console.log("axios");
        const response = await axios.put(
          `/api/projects/${router.query.projectId}`,
          {
            name: projectInputs.name,
            description: projectInputs.description,
            start_date: projectInputs.start_date.getTime().toString(),
            end_date: projectInputs.end_date.getTime().toString(),
            sort_order: projectInputs.sort_order,
            description: JSON.stringify(
              convertToRaw(projectInputs.description.getCurrentContent())
            ),
            participants: projectInputs.participants,
          }
        );

        if (response && response.data && response.data.project) {
          alert.success("Success !");
          router.push("/admin");
        }
      } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
          alert.error(e.response.data.message);
        }
        alert.error(e.message);
      }
    } else {
      router.push("/admin");
    }
  };

  const panes = [
    {
      menuItem: "General",
      render: () => {
        return (
          <Tab.Pane attached={false}>
            <Form.Group>
              <Form.Field width={8}>
                <label>Start Date</label>
                <ReactDateTime
                  value={projectInputs.start_date}
                  onChange={(a) => {
                    setProjectInputs({
                      ...projectInputs,
                      start_date: a._d,
                    });
                  }}
                />
              </Form.Field>
              <Form.Field width={8}>
                <label>End Date</label>
                <ReactDateTime
                  value={projectInputs.end_date}
                  onChange={(a) => {
                    setProjectInputs({
                      ...projectInputs,
                      end_date: a._d,
                    });
                  }}
                />
              </Form.Field>
            </Form.Group>

            <Form.Field>
              <label>Sort Order</label>
              <input
                type="number"
                name="sort_order"
                onChange={simpleInputChange}
                value={projectInputs.sort_order}
              />
            </Form.Field>
            <Form.Field>
              <label>Project Name</label>
              <input
                type="text"
                name="name"
                onChange={simpleInputChange}
                value={projectInputs.name}
              />
            </Form.Field>
            <Form.Field>
              <label>Project Description</label>
              <Editor
                editorState={projectInputs.description}
                onChange={(editorState) => {
                  setProjectInputs({
                    ...projectInputs,
                    description: editorState,
                  });
                }}
              />
            </Form.Field>
          </Tab.Pane>
        );
      },
    },
    {
      menuItem: "Participants",
      render: () => {
        return (
          <Tab.Pane attached={false}>
            {projectInputs.participants.map((participant) => {
              if (participant.deleted) {
                return false;
              }
              return (
                <Segment raised key={participant._id}>
                  <Form.Field
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                    }}
                  >
                    <Icon
                      name="trash"
                      color="red"
                      circular
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        const participantId = participant._id;
                        setProjectInputs(
                          produce(projectInputs, (draft) => {
                            const findIndex = draft.participants.findIndex(
                              (participant) => participant._id === participantId
                            );
                            if (findIndex || findIndex === 0) {
                              draft.participants[findIndex].deleted = true;

                              if (draft.participants[findIndex].author == "") {
                                draft.participants[findIndex].author =
                                  "DELETED";
                              }
                              if (draft.participants[findIndex].source == "") {
                                draft.participants[findIndex].source =
                                  "DELETED";
                              }
                            }
                          })
                        );
                      }}
                    />
                  </Form.Field>

                  <Form.Field>
                    <label>Author</label>
                    <input
                      type="text"
                      name="author"
                      onChange={(e) => {
                        const participantId = participant._id;
                        setProjectInputs(
                          produce(projectInputs, (draft) => {
                            const findIndex = draft.participants.findIndex(
                              (participant) => participant._id === participantId
                            );
                            if (findIndex || findIndex === 0) {
                              draft.participants[findIndex]["author"] =
                                e.target.value;
                            }
                          })
                        );
                      }}
                      value={participant.author}
                    />
                  </Form.Field>
                  <Form.Field>
                    <label>Source</label>
                    <input
                      type="text"
                      name="source"
                      onChange={(e) => {
                        const participantId = participant._id;
                        setProjectInputs(
                          produce(projectInputs, (draft) => {
                            const findIndex = draft.participants.findIndex(
                              (participant) => participant._id === participantId
                            );
                            if (findIndex || findIndex === 0) {
                              draft.participants[findIndex]["source"] =
                                e.target.value;
                            }
                          })
                        );
                      }}
                      value={participant.source}
                    />
                  </Form.Field>
                </Segment>
              );
            })}
            <Segment raised textAlign="center" size="mini">
              <Button as="div" primary size="tiny" onClick={addParticipant}>
                Add Participant
              </Button>
            </Segment>
          </Tab.Pane>
        );
      },
    },
  ];

  return (
    <div className="admin-update-project-page">
      <Form>
        {projectInputs.loading ? (
          <Dimmer active inverted style={{ minHeight: 300 }}>
            <Loader size="medium">Loading</Loader>
          </Dimmer>
        ) : (
          <>
            <Tab
              className="tabs update-project-tabs"
              menu={{ pointing: true }}
              panes={panes}
            />
            <Button
              className="big-button"
              type="submit"
              fluid
              icon
              size="small"
              color="blue"
              onClick={submitForm}
            >
              <Icon name="save" />
              Edit Project
            </Button>
          </>
        )}
      </Form>
    </div>
  );
}

// EditorState.createWithContent(
//           convertFromRaw(JSON.parse(this.props.defaultState))
//        )

/*      const raw = convertToRaw(editorState.getCurrentContent());
      this.setState({ editorState });
      this.props.setProjectInputs({
        ...this.props.projectInputs,
        description: JSON.stringify(raw),
      });*/
