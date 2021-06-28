import Head from "next/head";
import Link from "next/link";
import { Button, Divider, Header, Icon, Grid } from "semantic-ui-react";
import AdminLoginRegisterForm from "../../components/admin/LoginRegisterForm";
import { useSelector } from "react-redux";

export default function AdminHome() {
  const state = useSelector((state) => state);
  return (
    <div className="admin-homepage">
      {state.admin.loggedIn ? <div>loggedIn</div> : <AdminLoginRegisterForm />}
    </div>
  );
}
