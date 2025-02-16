import { createContext, useContext, useEffect, useState } from "react";
import * as RX from "rxjs";
import Viewer from "../viewer/viewer";

export const ViewerContext = createContext<Viewer | null>(null);

export function useViewer() {
  const viewer = useContext(ViewerContext);

  if (viewer === null) {
    throw new Error("useViewer must be used within a ViewerProvider");
  }

  return viewer;
}

export function useBehaviorSubject<T>(subject: RX.BehaviorSubject<T>): T {
  const [value, setValue] = useState(subject.getValue());

  useEffect(() => {
    const subscription = subject.subscribe((newValue) => {
      setValue(newValue);
    });

    return () => subscription.unsubscribe();
  }, [subject]);

  return value;
}
