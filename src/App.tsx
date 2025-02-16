import "./App.css";
import Loading from "./components/loading";
import ViewerComponent from "./components/viewer-component";

function App() {
  return (
    <>
      <ViewerComponent>
        <Loading />
        {/* 
          TODO Создай здесь виджет
          виджет должен отображать иерархию THREE.Object3D в переменной viewer.model 
          клик по объекту иерархии должен хайлатить объект во вьювере
          */}
      </ViewerComponent>
    </>
  );
}

export default App;
