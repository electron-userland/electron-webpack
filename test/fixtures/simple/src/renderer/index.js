import "./style.css"
import html from "@/foo.html"
import * as path from "path"

console.log(html)

const fileContents = fs.readFileSync(path.join(__static, "/foo.txt")).toString("hex")
console.log(fileContents)

class A {
}