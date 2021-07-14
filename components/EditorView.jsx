import { convertFromRaw, Editor, EditorState } from "draft-js";
import React, { useState, useEffect } from "react";

export default function EditorView(props) {
  const [state, setState] = useState(
    EditorState.createWithContent(convertFromRaw(JSON.parse(props.description)))
  );

  useEffect(() => {
    setState(
      EditorState.createWithContent(
        convertFromRaw(JSON.parse(props.description))
      )
    );
  }, [props.description]);
  return <Editor editorState={state} readOnly />;
}
