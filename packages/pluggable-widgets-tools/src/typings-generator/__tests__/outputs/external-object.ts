export const externalObjectWebOutput = `/**
 * This file was generated from MyWidget.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ComponentType, CSSProperties, ReactNode } from "react";
import { ActionValue, EditableValue } from "mendix";
import { ScrollContainerRegion } from "./region";

export interface MyWidgetContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    content: ReactNode;
    left: ScrollContainerRegion;
    description: EditableValue<string>;
    action?: ActionValue;
}

export interface MyWidgetPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    content: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    left: ScrollContainerRegion;
    description: string;
    action: {} | null;
}
`;
export const containmentNativeOutput = `export interface MyWidgetProps<Style> {
    name: string;
    style: Style[];
    content: ReactNode;
    description: EditableValue<string>;
    action?: ActionValue;
}`;
