const fs = require("fs");

module.exports = {
    create: (options = {
        ignoreWarnings: 0,
        defaultMetas: true
    }) => {
        return {
            create: {
                Comment: (text = "") => {
                    return { meta: "//", name: "", value: text};
                },
                Rule: (name = "", value = false) => {
                    return { meta: "RULE", name: name.replace(" ", "_"), value: value};
                },
                Element: (meta, name, value) => {
                    if (options.defaultMetas) {  // If default metas are on
                        switch (meta) {
                            case "int":
                                return { meta: meta, name: name, value: (typeof value === "string") ? parseInt(value) : value };
                            case "dou":
                            case "flo":
                                return { meta: meta, name: name, value: (typeof value === "string") ? parseFloat(value) : value };
                            case "str":
                                return { meta: meta, name: name, value: value};
                            case "boo":
                                return { meta: meta, name: name, value: (value === true) ? "true" : "false"};
                            case "arr":
                                let arrResult = "";
                                value.map((val, i) => {
                                    if (i < value.length - 1) {
                                        // Add periods as long as i isn't at the end of the array
                                        arrResult += "\t" + val + ",\n";
                                    } else {
                                        arrResult += "\t" + val;
                                    }
                                })

                                return { meta: meta, name: name, value: `<array>\n${arrResult}\n</array>`};
                            case "obj":
                                return { meta: meta, name: name, value: JSON.stringify(value, )};
                        }
                    }
                    return { meta: meta, name: name, value: value};
                },
            },
            get: {
                Rule: (data = [], name = "") => {
                    // I don't know what i just programmed but it works so
                    // Very nice, i am very professional yes yes big math
                    let ruleFound = null;
                    data.map((val) => {
                        if (val.startsWith("RULE ")) {  // Is rule?
                            if (val.substring(4, name.length - 1) === name) {  // Get and check the name
                                ruleFound = val.substring(name.length, val.length);
                            }
                        }
                    });
                    return ruleFound;
                },
                Element: (data, name) => {
                    if (typeof data === "string")
                        data = data.split('\n');

                    for (let i = 0; i < data.length; ++i) {
                        let currLine = data[i].split(' ');
                        if (currLine[0].startsWith("//")) continue;
                        if (currLine[1] === name && currLine[2] === '=') {
                            let obj = { meta: currLine[0], name: currLine[1], value: null };

                            let val = currLine;
                            if (options.defaultMetas === true) {
                                switch (obj.meta) {
                                    case "arr":
                                        let arraySpace = [];

                                        for (let q = i+1; q < data.length; ++q) {
                                            if (data[q].startsWith("</array>")) break;

                                            // TODO: Check here if anything is broken \/
                                            if (data[q].startsWith('\t'))
                                                data[q] = data[q].substring(1, data[q].length);
                                            if (data[q].endsWith(','))
                                                data[q] = data[q].substring(0, data[q].length - 2);

                                            if (!isNaN(data[q])) // If data[q] is a number
                                                data[q] = parseInt(data[q]);
                                            else if (data[q].endsWith("f") && !isNaN(data[q].substring(0, data[q].length - 2)))
                                                data[q] = parseFloat(data[q]);

                                            arraySpace.push(data[q]);
                                        }

                                        obj.value = arraySpace;
                                        break;
                                    case "int":
                                        val.splice(0, 3);
                                        obj.value = parseInt(val.join(' '));
                                        break;
                                    case "obj":
                                        val.splice(0, 3);
                                        obj.value = JSON.parse(val.join(' '));
                                        break;
                                    default:
                                        val.splice(0, 3);
                                        obj.value = val.join(' ');
                                        break;
                                }
                            } else {
                                // Else if defaultMetas are off
                                val.splice(0, 3);
                                obj.value = val.join(' ');
                            }

                            return obj;
                        }
                    }
                }
            },
            IO: {
                Read: (path) => fs.readFileSync(path, "utf8"),
                Write: (path, data) => fs.writeFileSync(path, data),
                Add: (path, data) => fs.readFile(path, "utf8", (err, fileData) => {
                    if (err) throw err;
                    if (fileData.slice(-1) !== '\n') fileData += '\n';

                    fs.writeFileSync(path, fileData + data);
                }),
                ParseData: (data = []) => {
                    let parsed = "";
                    for (let i = 0; i < data.length; ++i) {
                        if (data[i].meta.startsWith("//")) {
                            parsed += `// ${data[i].value}\n`;
                            continue;
                        } else if (data[i].meta === "RULE") {
                            parsed += `RULE ${data[i].name} ${data[i].value}\n`;
                            continue;
                        }
                        parsed += `${data[i].meta} ${data[i].name} = ${data[i].value}` + "\n";
                    }
                    return parsed;
                },
                fs: fs
            },
        }
    }
};