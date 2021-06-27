import Link from "next/link";
import { Button, Icon } from "semantic-ui-react";

export default function Header() {
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
        <ul className="menu">
          <li className="active">
            <Link href="/">
              <a>PROJECTS</a>
            </Link>
          </li>
        </ul>
        <Button icon loading={false} labelPosition="left">
          <Icon name="plug" />
          Connect
        </Button>
      </div>
    </header>
  );
}
