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
import DateTimeRangePicker from "@wojtekmaj/react-datetimerange-picker/dist/entry.nostyle";
import Editor from "../../../components/admin/Editor";

export default function AdminAddProject() {
  const state = useSelector((state) => state);
  const [date, setDate] = useState([new Date(), new Date()]);
  const [projectInputs, setProjectInputs] = useState({
    name: "",
    description: "",
    sort_order: 0,
    start_date: "",
    end_date: "",
    participants: [],
  });

  const simpleInputChange = (e) => {
    return setProjectInputs({
      ...projectInputs,
      [e.target.name]: e.target.value,
    });
  };

  const panes = [
    {
      menuItem: "General",
      render: () => {
        return (
          <Tab.Pane attached={false}>
            <Form.Field
              style={{
                display: "flex",
                flexDirection: "column",
                margin: "0 0 1em",
              }}
            >
              <label
                style={{
                  display: "block",
                  margin: "0 0 .28571429rem 0",
                  color: "rgba(0,0,0,.87)",
                  fontSize: ".92857143em",
                  fontWeight: 700,
                  textTransform: "none",
                }}
              >
                Start Date / End Date
              </label>
              <div>
                <DateTimeRangePicker
                  onChange={(a) => {
                    const [startDate, endDate] = a;
                    setProjectInputs({
                      ...projectInputs,
                      start_date: startDate.getTime(),
                      end_date: endDate.getTime(),
                    });
                    setDate(a);
                  }}
                  value={date}
                  minDate={new Date()}
                  format="MM/dd/y h:m a"
                  disableClock={true}
                  rangeDivider=""
                />
              </div>
            </Form.Field>
            <div className="ui form">
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
                  projectInputs={projectInputs}
                  setProjectInputs={setProjectInputs}
                />
              </Form.Field>
            </div>
          </Tab.Pane>
        );
      },
    },
    {
      menuItem: "Participants",
      render: () => {
        return (
          <Tab.Pane attached={false}>
            {[""].map((optionValue) => {
              return (
                <Segment raised key={""}>
                  <div className="ui form">
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
                      />
                    </Form.Field>

                    <Form.Field>
                      <label>Author</label>
                      <input type="text" name="name" value={""} />
                    </Form.Field>
                    <Form.Field>
                      <label>Source</label>
                      <input type="number" name="sort_order" value={""} />
                    </Form.Field>
                  </div>
                </Segment>
              );
            })}
            <Segment raised textAlign="center" size="mini">
              <Button as="div" primary size="tiny">
                Add Participants
              </Button>
            </Segment>
          </Tab.Pane>
        );
      },
    },
  ];

  return (
    <div className="admin-add-project-page">
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
      >
        <Icon name="add square" />
        Add Project
      </Button>
    </div>
  );
}
