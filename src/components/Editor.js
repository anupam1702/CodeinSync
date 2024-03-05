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
    let [india, setindia] = useState("");
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
    },[]);

    useEffect(() => {
      if (socketRef.current) {
        socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
          if (code !== null) {
            editorRef.current.setValue(code);
           

           // krdebhai();
          }
        });
        socketRef.current.on(ACTIONS.SET_OUTPUT, ({ details }) => {
          console.log(details);
          setindia(details.Result);
        });
      }

      return () => {
        socketRef.current.off(ACTIONS.CODE_CHANGE);
        socketRef.current.off(ACTIONS.SET_OUTPUT);
      };
    }, [socketRef.current]);

   
    let krdebhai =  () => {
      let code = editorRef.current.getValue();
      const options = {
        method: "POST",
        url: process.env.REACT_APP_RAPID_API_URL,
        headers: {
          "content-type": "application/json",
          "X-RapidAPI-Key": process.env.REACT_APP_RAPID_API_KEY,
          "X-RapidAPI-Host": process.env.REACT_APP_RAPID_API_HOST,
        },
        data: {
          LanguageChoice: "17",

          Program: code,
          Input: "",
        },
      };
      // try {
      //   const response = await axios.request(options);
      //   // console.log(response.data);
      //   if (response.data.Errors === null) {
      //     setindia(response.data.Result);
      //   } else {
      //     setindia(response.data.Errors);
      //   }
      // } catch (error) {
      //   console.error(error);
      // }
      axios
      .request(options)
      .then((response) => {
        if (response.data.Errors === null) {
          setindia(response.data.Result);
        } else {
          setindia(response.data.Errors);
        }
        socketRef.current.emit(ACTIONS.OUTPUT, { roomId: roomId, details: response.data });
      })
      .catch((error) => {
        console.error(error);
      });
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
