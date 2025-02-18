import "./App.css";
import Loading from "./components/loading";
import ViewerComponent from "./components/viewer-component";
import ObjectHierarchyWidget from "./components/ObjectHierarchyWidget"; // Import the new widget

function App() {
    return (
        <>
            <ViewerComponent>
                <Loading />
                <ObjectHierarchyWidget /> {/* Add the widget here */}
            </ViewerComponent>
        </>
    );
}

export default App;