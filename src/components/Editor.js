import React, { useEffect, useRef, useState } from "react";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/clike/clike.js";
import "codemirror/addon/edit/closetag";
import "codemirror/mode/python/python.js";
import "codemirror/addon/edit/closebrackets";
import axios from "axios";
import ACTIONS from "../Actions";

const Editor = ({ socketRef, roomId, onCodeChange }) => {
  const editorRef = useRef(null);
  useEffect(() => {
    async function init() {
      editorRef.current = Codemirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: { name: "javascript", json: true },
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
        }
      );

      editorRef.current.on("change", (instance, changes) => {
        console.log("changes", changes);
        const { origin } = changes;
        const code = instance.getValue();

        onCodeChange(code);
        if (origin !== "setValue") {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });
        }

        console.log(code);
      });
    }
    init();
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null) {
          editorRef.current.setValue(code);
          krdebhai();
        }
      });
    }

    return () => {
      socketRef.current.off(ACTIONS.CODE_CHANGE);
    };
  }, [socketRef.current]);

  let [india, setindia] = useState("");
  let krdebhai = async () => {
    const code = editorRef.current.getValue();
    const options = {
      method: "POST",
      url: "https://code-compiler.p.rapidapi.com/v2",
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": "4218c57f2emsh0cb077ce2479003p124f05jsn15d74435b577",
        "X-RapidAPI-Host": "code-compiler.p.rapidapi.com",
      },
      data: {
        LanguageChoice: "17",

        Program: code,
        Input: "",
      },
    };
    try {
      const response = await axios.request(options);
      // console.log(response.data);
      if (response.data.Errors === null) {
        setindia(response.data.Result);
      } else {
        setindia(response.data.Errors);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <button onClick={krdebhai} className="run">
        Run
      </button>
      <textarea id="realtimeEditor"></textarea>

      <textarea
        value={india}
        className="ind"
        style={{
          position: "absolute",
          top: "167px",
          right: "25px",
          height: "350px",
          width: "400px",
          backgroundColor: "#282a36",
          color: "white",
        }}
      ></textarea>
    </div>
  );
};

export default Editor;
