import { useBehaviorSubject, useViewer } from "../hooks";

const Loading: React.FC = () => {
  const viewer = useViewer();
  const status = useBehaviorSubject(viewer.status);

  return (
    <div style={{ position: "absolute", top: "50vh", right: "50vw" }}>
      {status === "loading" && <>loading</>}
      {status === "error" && <>error</>}
    </div>
  );
};

export default Loading;
