import Head from "next/head";
import Link from "next/link";
import { Button, Divider, Header, Icon, Grid } from "semantic-ui-react";
import AdminLoginRegisterForm from "../../components/admin/LoginRegisterForm";

export default function AdminHome() {
  return (
    <div className="admin-homepage">
      <AdminLoginRegisterForm />
    </div>
  );
}
