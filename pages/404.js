import { Header, Button, Icon } from "semantic-ui-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="not-found-page">
      <Header as="h2" textAlign="center">
        PAGE NOT FOUND
      </Header>
      <Button icon labelPosition="left">
        Go Home
        <Icon name="home" />
      </Button>
    </div>
  );
}
