import Sidebar from "./Sidebar";

function Layout({ children }) {
    return (
        <div style={styles.layout}>
            <Sidebar />

            <main style={styles.main}>
                {children}
            </main>
        </div>
    );
}

const styles = {
    layout: {
        minHeight: "100vh",
        background: "#f5f7fb",
    },

    main: {
        marginLeft: "240px",
        minHeight: "100vh",
        padding: "32px 40px",
        boxSizing: "border-box",
        width: "calc(100% - 240px)",
    },
};

export default Layout;