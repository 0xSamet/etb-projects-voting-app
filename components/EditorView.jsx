import { convertFromRaw, Editor, EditorState } from "draft-js";
import React, { useState } from "react";

export default function EditorView(props) {
  const [state, setState] = useState(
    EditorState.createWithContent(convertFromRaw(JSON.parse(props.description)))
  );
  return <Editor editorState={state} readOnly />;
}
