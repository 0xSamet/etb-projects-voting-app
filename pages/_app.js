import "semantic-ui-css/semantic.min.css";
import "../styles/global.scss";

import Header from "../components/Header";
import AdminHeader from "../components/admin/Header";
import Footer from "../components/Footer";
import Alert from "../components/Alert";

import { useRouter } from "next/router";
import { positions, Provider as ReactAlertProvider } from "react-alert";
import { Provider as ReduxProvider } from "react-redux";
import { wrapper } from "../store";

const alertOptions = {
  timeout: 5000,
  position: positions.BOTTOM_CENTER,
};

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  return router.route === "/404" ? (
    <div className="main-wrapper">
      <Header />
      <main className="content">
        <ReactAlertProvider template={Alert} {...alertOptions}>
          <Component {...pageProps} />
        </ReactAlertProvider>
      </main>
      <Footer />
    </div>
  ) : router.asPath.slice(0, 6) === "/admin" ? (
    <div className="main-wrapper">
      <AdminHeader />
      <main className="content">
        <ReactAlertProvider template={Alert} {...alertOptions}>
          <Component {...pageProps} />
        </ReactAlertProvider>
      </main>
      <Footer />
    </div>
  ) : (
    <div className="main-wrapper">
      <Header />
      <main className="content">
        <ReactAlertProvider template={Alert} {...alertOptions}>
          <Component {...pageProps} />
        </ReactAlertProvider>
      </main>
      <Footer />
    </div>
  );
}

export async function getInitialProps({ Component, ctx }) {
  const pageProps = Component.getInitialProps
    ? await Component.getInitialProps(ctx)
    : {};

  return {
    pageProps,
  };
}

export default wrapper.withRedux(MyApp);
