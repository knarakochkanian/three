import "./App.css";
import Loading from "./components/loading";
import ViewerComponent from "./components/viewer-component";
import ObjectHierarchyWidget from "./components/ObjectHierarchyWidget";

function App() {
    return (
        <>
            <ViewerComponent>
                <Loading />
                <ObjectHierarchyWidget />
            </ViewerComponent>
        </>
    );
}

export default App;