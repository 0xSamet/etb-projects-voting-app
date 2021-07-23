import {
  Button,
  Icon,
  Tab,
  Form,
  Segment,
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

export default function AdminEditPoll() {
  const state = useSelector((state) => state);
  const [pollInputs, setPollInputs] = useState({
    loading: true,
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

  useEffect(() => {
    if (router.query.pollId) {
      const getPoll = async () => {
        try {
          const response = await axios(`/api/polls/${router.query.pollId}`);

          if (response && response.data && response.data.poll) {
            setPollInputs({
              ...response.data.poll,
              start_date: new Date(Number(response.data.poll.start_date)),
              end_date: new Date(Number(response.data.poll.end_date)),
              description: EditorState.createWithContent(
                convertFromRaw(JSON.parse(response.data.poll.description))
              ),
            });
          }
        } catch (e) {
          if (e.response && e.response.data && e.response.data.message) {
            alert.error(e.response.data.message);
          }
        }
      };
      getPoll();
    }
  }, [router.query.pollId]);

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
        {
          _id: String(pollInputs.proposals.length),
          text: "",
          newProposal: true,
          deleted: false,
        },
      ],
    });
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (router.query && router.query.pollId) {
      try {
        const response = await axios.put(`/api/polls/${router.query.pollId}`, {
          name: pollInputs.name,
          description: pollInputs.description,

          start_date: pollInputs.start_date.getTime().toString(),
          end_date: pollInputs.end_date.getTime().toString(),
          sort_order: pollInputs.sort_order,
          description: JSON.stringify(
            convertToRaw(pollInputs.description.getCurrentContent())
          ),
          proposals: pollInputs.proposals,
        });

        if (response && response.data && response.data.poll) {
          alert.success("Success !");
          router.push("/admin");
        }
      } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
          return alert.error(e.response.data.message);
        }
        return alert.error(e.message);
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
              <label>Project Name</label>
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
              if (proposal.deleted) {
                return false;
              }
              return (
                <Segment raised key={proposal._id}>
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
                        const proposalId = proposal._id;
                        setPollInputs(
                          produce(pollInputs, (draft) => {
                            const findIndex = draft.proposals.findIndex(
                              (proposal) => proposal._id === proposalId
                            );
                            if (findIndex || findIndex === 0) {
                              draft.proposals[findIndex].deleted = true;

                              if (draft.proposals[findIndex].text == "") {
                                draft.proposals[findIndex].text = "DELETED";
                              }
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
                      name="text"
                      onChange={(e) => {
                        const proposalId = proposal._id;
                        setPollInputs(
                          produce(pollInputs, (draft) => {
                            const findIndex = draft.proposals.findIndex(
                              (proposal) => proposal._id === proposalId
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
    <div className="admin-sub-page admin-update-poll-page">
      {state.admin.loggedIn && (
        <Form onSubmit={submitForm}>
          {pollInputs.loading ? (
            <Dimmer active inverted style={{ minHeight: 300 }}>
              <Loader size="medium">Loading</Loader>
            </Dimmer>
          ) : (
            <>
              <Tab
                className="tabs update-poll-tabs sub-page-tabs"
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
              >
                <Icon name="save" />
                Edit Poll
              </Button>
            </>
          )}
        </Form>
      )}
    </div>
  );
}
