import Head from "next/head";
import Link from "next/link";
import { Button, Divider, Header, Icon, Grid, Table } from "semantic-ui-react";
import AdminLoginRegisterForm from "../../components/admin/LoginRegisterForm";
import { useSelector } from "react-redux";

export default function AdminHome() {
  const state = useSelector((state) => state);
  return (
    <div className="admin-homepage">
      {state.admin.loggedIn ? (
        <>
          <Table
            celled
            compact
            className="admin-results-table admin-results-table-top"
          >
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell colSpan="3" textAlign="right">
                  <Link href="/admin/projects/add">
                    <a>
                      <Button
                        icon
                        labelPosition="left"
                        size="tiny"
                        color="blue"
                      >
                        <Icon name="add square" />
                        Add Project
                      </Button>
                    </a>
                  </Link>
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
          </Table>
          <Table celled compact className="admin-results-table">
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Projects</Table.HeaderCell>
                <Table.HeaderCell collapsing textAlign="center">
                  Sort Order
                </Table.HeaderCell>
                <Table.HeaderCell
                  collapsing
                  textAlign="center"
                ></Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              <Table.Row key={1}>
                <Table.Cell>{"Project 1"}</Table.Cell>
                <Table.Cell textAlign="center">{0}</Table.Cell>
                <Table.Cell singleLine>
                  <Link
                    href={`/admin/ayarlar/yerellestirme/bolgeler/duzenle/${1}`}
                  >
                    <a>
                      <Button
                        icon
                        labelPosition="left"
                        size="tiny"
                        color="teal"
                      >
                        <Icon name="edit" />
                        Edit
                      </Button>
                    </a>
                  </Link>
                  <Button icon="trash" size="tiny" color="red"></Button>
                </Table.Cell>
              </Table.Row>
            </Table.Body>

            <Table.Footer>
              <Table.Row>
                <Table.HeaderCell colSpan="3" textAlign="right">
                  {/* <Menu floated="right" pagination>
                  <Menu.Item as="a" icon>
                    <Icon name="chevron left" />
                  </Menu.Item>
                  <Menu.Item as="a">1</Menu.Item>
                  <Menu.Item as="a">2</Menu.Item>
                  <Menu.Item as="a">3</Menu.Item>
                  <Menu.Item as="a">4</Menu.Item>
                  <Menu.Item as="a" icon>
                    <Icon name="chevron right" />
                  </Menu.Item>
                </Menu> */}
                  {"Pagination yapılacak"}
                </Table.HeaderCell>
              </Table.Row>
            </Table.Footer>
          </Table>
        </>
      ) : (
        <AdminLoginRegisterForm />
      )}
    </div>
  );
}
