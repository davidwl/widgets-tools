import { generateClientTypes } from "./generateClientTypes";
import { generatePreviewTypes } from "./generatePreviewTypes";
import { extractProperties, extractSystemProperties } from "./helpers";
import { WidgetXml } from "./WidgetXml";

const mxExports = [
    "ActionValue",
    "DynamicValue",
    "EditableValue",
    "FileValue",
    "ListValue",
    "NativeIcon",
    "NativeImage",
    "ListActionValue",
    "ListAttributeValue",
    "ListExpressionValue",
    "ListReferenceValue",
    "ListReferenceSetValue",
    "ListWidgetValue",
    "ReferenceValue",
    "ReferenceSetValue",
    "SelectionSingleValue",
    "SelectionMultiValue",
    "WebIcon",
    "WebImage"
];

export function generateForWidget(widgetXml: WidgetXml, widgetName: string) {
    if (!widgetXml?.widget?.properties) {
        throw new Error("[XML] XML doesn't contains <properties> element");
    }
    if (widgetXml.widget.$.pluginWidget !== "true") {
        throw new Error("[XML] Attribute pluginWidget=true not found. Please review your XML");
    }

    const isNative = widgetXml.widget.$.supportedPlatform === "Native";

    const propElements = widgetXml.widget.properties[0] ?? [];
    const properties = extractProperties(propElements).filter(prop => prop?.$?.key);
    const systemProperties = extractSystemProperties(propElements).filter(prop => prop?.$?.key);
    const externalImports = new Map<string, string[]>();
    const clientTypes = generateClientTypes(widgetName, properties, systemProperties, externalImports, isNative);
    const modelerTypes = generatePreviewTypes(widgetName, properties, systemProperties);

    
    const generatedTypesCode = clientTypes
        .slice(0, clientTypes.length - 1) // all client auxiliary types
        .concat(modelerTypes.slice(0, modelerTypes.length - 1)) // all preview auxiliary types
        .concat([clientTypes[clientTypes.length - 1], modelerTypes[modelerTypes.length - 1]])
        .join("\n\n");

    

    const imports = [
        generateImport("react", generatedTypesCode, ["ComponentType", "CSSProperties", "ReactNode"]),
        generateImport("mendix", generatedTypesCode, mxExports),
        generateImport("big.js", generatedTypesCode, ["Big"]),
        ...(Array.from(externalImports).map(e => generateImport(e[0], generatedTypesCode, e[1])))
    ]
        .filter(line => line)
        .join("\n");

    return `/**
 * This file was generated from ${widgetName}.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
${imports.length ? imports + "\n\n" : ""}${generatedTypesCode}
`;
}

function generateImport(from: string, code: string, availableNames: string[]) {
    const usedNames = availableNames.filter(type => new RegExp(`\\W${type}\\W`).test(code));
    return usedNames.length ? `import { ${usedNames.join(", ")} } from "${from}";` : "";
}
