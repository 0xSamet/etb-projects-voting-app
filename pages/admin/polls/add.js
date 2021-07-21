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
import { useState, useEffect } from "react";
import Editor from "../../../components/admin/Editor";
import produce from "immer";
import axios from "axios";
import { useRouter } from "next/router";
import { useAlert } from "react-alert";
import { EditorState, convertToRaw } from "draft-js";
import ReactDateTime from "react-datetime";

export default function AdminAddPoll() {
  const state = useSelector((state) => state);
  const [pollInputs, setPollInputs] = useState({
    name: "",
    description: EditorState.createEmpty(),
    sort_order: 0,
    start_date: new Date(new Date().setSeconds(0)),
    end_date: new Date(new Date().setSeconds(0)),
    proposals: [],
  });
  const router = useRouter();
  const alert = useAlert();

  useEffect(() => {
    if (!state.admin.loggedIn) {
      router.push("/admin");
    }
  }, [state.admin.loggedIn]);

  const simpleInputChange = (e) => {
    return setPollInputs({
      ...pollInputs,
      [e.target.name]: e.target.value,
    });
  };

  const addProposal = (e) => {
    return setPollInputs({
      ...pollInputs,
      proposals: [
        ...pollInputs.proposals,
        { id: pollInputs.proposals.length, text: "" },
      ],
    });
  };

  const submitForm = async () => {
    try {
      const response = await axios.post("/api/polls", {
        ...pollInputs,
        proposals: pollInputs.proposals.map((proposal) => {
          return {
            text: proposal.text,
          };
        }),
        start_date: pollInputs.start_date.getTime().toString(),
        end_date: pollInputs.end_date.getTime().toString(),
        description: JSON.stringify(
          convertToRaw(pollInputs.description.getCurrentContent())
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
                  value={pollInputs.start_date}
                  onChange={(a) => {
                    setPollInputs({
                      ...pollInputs,
                      start_date: a._d,
                    });
                  }}
                />
              </Form.Field>
              <Form.Field width={8}>
                <label>End Date</label>
                <ReactDateTime
                  value={pollInputs.end_date}
                  onChange={(a) => {
                    setPollInputs({
                      ...pollInputs,
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
                value={pollInputs.sort_order}
              />
            </Form.Field>
            <Form.Field>
              <label>Poll Name</label>
              <input
                type="text"
                name="name"
                onChange={simpleInputChange}
                value={pollInputs.name}
              />
            </Form.Field>
            <Form.Field>
              <label>Poll Description (Detail Page)</label>
              <Editor
                editorState={pollInputs.description}
                onChange={(editorState) => {
                  setPollInputs({
                    ...pollInputs,
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
      menuItem: "Proposals",
      render: () => {
        return (
          <Tab.Pane attached={false}>
            {pollInputs.proposals.map((proposal) => {
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
                        const proposalId = proposal.id;
                        setPollInputs(
                          produce(pollInputs, (draft) => {
                            const findIndex = draft.proposals.findIndex(
                              (proposal) => proposal.id === proposalId
                            );
                            if (findIndex || findIndex === 0) {
                              draft.proposals = draft.proposals.filter(
                                (proposal) => proposal.id !== proposalId
                              );
                            }
                          })
                        );
                      }}
                    />
                  </Form.Field>
                  <Form.Field>
                    <label>Text</label>
                    <input
                      type="text"
                      name="source"
                      onChange={(e) => {
                        const proposalId = proposal.id;
                        setPollInputs(
                          produce(pollInputs, (draft) => {
                            const findIndex = draft.proposals.findIndex(
                              (proposal) => proposal.id === proposalId
                            );
                            if (findIndex || findIndex === 0) {
                              draft.proposals[findIndex]["text"] =
                                e.target.value;
                            }
                          })
                        );
                      }}
                      value={proposal.text}
                    />
                  </Form.Field>
                </Segment>
              );
            })}
            <Segment raised textAlign="center" size="mini">
              <Button as="div" primary size="tiny" onClick={addProposal}>
                Add Proposal
              </Button>
            </Segment>
          </Tab.Pane>
        );
      },
    },
  ];

  return (
    <div className="admin-add-poll-page">
      {state.admin.loggedIn && (
        <Form>
          <Tab
            className="tabs add-poll-tabs"
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
            Add Poll
          </Button>
        </Form>
      )}
    </div>
  );
}
