import { Property, SystemProperty } from "./WidgetXml";
import { capitalizeFirstLetter, extractProperties } from "./helpers";
import { hasOptionalDataSource, toUniqueUnionType } from "./generateClientTypes";

export function generatePreviewTypes(
    widgetName: string,
    properties: Property[],
    systemProperties: SystemProperty[]
): string[] {
    const results = Array.of<string>();
    const externalImportedTypes = new Map<string, string[]>();
    const isLabeled = systemProperties.some(p => p.$.key === "Label");

    function resolveProp(key: string) {
        return properties.find(p => p.$.key === key);
    }

    results.push(`export interface ${widgetName}PreviewProps {${
        !isLabeled
            ? `
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;`
            : ""
    }
    readOnly: boolean;
${generatePreviewTypeBody(properties, results, externalImportedTypes, resolveProp)}
}`);
    return results;
}

function generatePreviewTypeBody(
    properties: Property[],
    generatedTypes: string[],
    externalImportedTypes: Map<string, string[]>,
    resolveProp: (key: string) => Property | undefined
) {
    return properties
        .map(prop => `    ${prop.$.key}: ${toPreviewPropType(prop, generatedTypes, externalImportedTypes, resolveProp)};`)
        .join("\n");
}

function toPreviewPropType(
    prop: Property,
    generatedTypes: string[],
    externalImportedTypes: Map<string, string[]>,
    resolveProp: (key: string) => Property | undefined
): string {
    switch (prop.$.type) {
        case "boolean":
            return "boolean";
        case "string":
            return "string";
        case "action":
            return "{} | null";
        case "textTemplate":
            return "string";
        case "integer":
        case "decimal":
            return "number | null";
        case "icon":
            return '{ type: "glyph"; iconClass: string; } | { type: "image"; imageUrl: string; iconUrl: string; } | { type: "icon"; iconClass: string; } | undefined';
        case "image":
            return '{ type: "static"; imageUrl: string; } | { type: "dynamic"; entity: string; } | null';
        case "file":
            return "string";
        case "datasource":
            // { type: string } is included here due to an incorrect API output before 9.2 (PAG-1400)
            return "{} | { caption: string } | { type: string } | null";
        case "attribute":
        case "association":
        case "expression":
            return "string";
        case "enumeration":
            return capitalizeFirstLetter(prop.$.key) + "Enum";
        case "object":
            if (!prop.properties?.length) {
                throw new Error("[XML] Object property requires properties element");
            }
            const childType = capitalizeFirstLetter(prop.$.key) + "PreviewType";
            const childProperties = extractProperties(prop.properties[0]);

            const resolveChildProp = (key: string) =>
                key.startsWith("../") ? resolveProp(key.substring(3)) : childProperties.find(p => p.$.key === key);

            generatedTypes.push(
                `export interface ${childType} {
${generatePreviewTypeBody(childProperties, generatedTypes, externalImportedTypes, resolveChildProp)}
}`
            );
            return prop.$.isList === "true" ? `${childType}[]` : childType;
        case "widgets":
            return "{ widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> }";
        case "selection":
            if (!prop.selectionTypes?.length) {
                throw new Error("[XML] Selection property requires selectionTypes element");
            }

            const selectionTypes = prop.selectionTypes.flatMap(s => s.selectionType).map(s => s.$.name);
            if (hasOptionalDataSource(prop, resolveProp)) {
                selectionTypes.push("None");
            }
            return toUniqueUnionType(selectionTypes.map(s => `"${s}"`));
        default:
            const parts = prop.$.type?.split(":")??[];
            if (parts.length == 2) {
                //object defined exetnally, type parts[0] need import from parts[1]
                const subinports = externalImportedTypes.get(parts[1])??[];
                if (!subinports.some(i => i === parts[0])) {
                    subinports.push(parts[0]);
                    externalImportedTypes.set(parts[1], subinports);
                }
                return parts[0];
            }
            return "any";
    }
}
