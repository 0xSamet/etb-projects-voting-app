import Link from "next/link";
import { Button, Icon } from "semantic-ui-react";

export default function AdminHeader() {
  return (
    <header>
      <div className="header-logo">
        <Link href="/">
          <a>
            <img src="/logo.png" />
          </a>
        </Link>
      </div>
      <div className="header-right">
        {false && (
          <Button icon loading={false} labelPosition="left">
            <Icon name="plug" />
            Connect
          </Button>
        )}
      </div>
    </header>
  );
}
