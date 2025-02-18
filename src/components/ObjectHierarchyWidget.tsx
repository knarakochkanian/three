import React, { useContext } from "react";
import { ViewerContext } from "../hooks";
import * as THREE from "three";

const ObjectHierarchyWidget: React.FC = () => {
    const viewer = useContext(ViewerContext);

    const renderObjectHierarchy = (object: THREE.Object3D) => {
        return (
            <ul key={object.uuid}>
                <li onClick={() => viewer?.highlightObject(object)}>
                    {object.name || `Object (${object.uuid})`}
                </li>
                {object.children &&
                    object.children.map((child) => renderObjectHierarchy(child))}
            </ul>
        );
    };

    return (
        <div className="object-hierarchy-widget">
            <h3>Object Hierarchy</h3>
            {viewer?.model ? (
                renderObjectHierarchy(viewer.model)
            ) : (
                <p>No model loaded.</p>
            )}
        </div>
    );
};

export default ObjectHierarchyWidget;