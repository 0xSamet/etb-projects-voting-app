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
} from "semantic-ui-react";
import { useSelector } from "react-redux";
import { useState } from "react";
import Editor from "../../../components/admin/Editor";
import produce from "immer";
import axios from "axios";
import { useRouter } from "next/router";
import { useAlert } from "react-alert";
import { EditorState, convertToRaw } from "draft-js";
import ReactDateTime from "react-datetime";

export default function AdminAddProject() {
  const state = useSelector((state) => state);
  const [projectInputs, setProjectInputs] = useState({
    name: "",
    description: EditorState.createEmpty(),
    short_description: "",
    sort_order: 0,
    start_date: new Date(new Date().setSeconds(0)),
    end_date: new Date(new Date().setSeconds(0)),
    participants: [],
  });
  const router = useRouter();
  const alert = useAlert();

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
        { id: projectInputs.participants.length, author: "", source: "" },
      ],
    });
  };

  const submitForm = async () => {
    try {
      const response = await axios.post("/api/projects", {
        ...projectInputs,
        participants: projectInputs.participants.map((participant) => {
          return {
            author: participant.author,
            source: participant.source,
          };
        }),
        start_date: projectInputs.start_date.getTime().toString(),
        end_date: projectInputs.end_date.getTime().toString(),
        description: JSON.stringify(
          convertToRaw(projectInputs.description.getCurrentContent())
        ),
      });

      if (response && response.data && response.data.success) {
        alert.success("Success !");
        router.push("/admin");
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.message) {
        return alert.error(e.response.data.message);
      }

      return alert.error(e.message);
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
              <label>Project Short Description (Homepage)</label>
              <textarea
                spellCheck={false}
                name="short_description"
                onChange={simpleInputChange}
                value={projectInputs.short_description}
              ></textarea>
            </Form.Field>
            <Form.Field>
              <label>Project Description (Detail Page)</label>
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
              return (
                <Segment raised key={""}>
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
                        const participantId = participant.id;
                        setProjectInputs(
                          produce(projectInputs, (draft) => {
                            const findIndex = draft.participants.findIndex(
                              (participant) => participant.id === participantId
                            );
                            if (findIndex || findIndex === 0) {
                              draft.participants = draft.participants.filter(
                                (participant) =>
                                  participant.id !== participantId
                              );
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
                        const participantId = participant.id;
                        setProjectInputs(
                          produce(projectInputs, (draft) => {
                            const findIndex = draft.participants.findIndex(
                              (participant) => participant.id === participantId
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
                        const participantId = participant.id;
                        setProjectInputs(
                          produce(projectInputs, (draft) => {
                            const findIndex = draft.participants.findIndex(
                              (participant) => participant.id === participantId
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
    <div className="admin-add-project-page">
      <Form>
        <Tab
          className="tabs add-project-tabs"
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
          <Icon name="add square" />
          Add Project
        </Button>
      </Form>
    </div>
  );
}
