    import React, { useEffect, useRef, useState } from "react";
    import Codemirror from "codemirror";
    import "codemirror/lib/codemirror.css";
    import Select from "react-select";
    import { Langauges } from "./Languages";
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
      let [india, setindia] = useState("Output will show here...");
      const [language, setLanguage] = useState({});
      const [customInput, setCustomInput] = useState('');
      let [selectedOption,setSelectedOption]=useState(null);

   
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

          socketRef.current.on(ACTIONS.SET_LANGUAGE, ({ lang }) => {
            // console.log(typeof lang);
            // console.log('lang',lang);
            console.log(lang);
            setSelectedOption(() => { return ({ ...lang }) });
            // console.log('lang',lang);
            // customOnSelectChange(lang);
          });
          socketRef.current.on(ACTIONS.CUSTOM_INPUT, ({ input }) => {
            // console.log(typeof (input));
            // console.log('input',input);
            setCustomInput(input);
            // console.log(input);
          })
        }

        return () => {
          socketRef.current.off(ACTIONS.CODE_CHANGE);
          socketRef.current.off(ACTIONS.SET_OUTPUT);
          socketRef.current.off(ACTIONS.SET_LANGUAGE);
          socketRef.current.off(ACTIONS.CUSTOM_INPUT);
        };
      }, [socketRef.current]);

    
      let krdebhai =  () => {
        console.log(selectedOption.id);
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
            LanguageChoice: selectedOption.id,

            Program: code,
            Input: customInput,
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

      const customStyles = {
        control: (provided,state) => ({
          ...provided,
          width: '20px', // Adjust the width as needed
          height: '20px', // Adjust the height as needed
        }),
      };

      const onSelectChange = (sl) => {
        // console.log("selected Option...", sl);
        console.log("Selected Option:", sl);
        setSelectedOption(sl);
        socketRef.current.emit(ACTIONS.LANGUAGE, ({ roomId: roomId, language: sl }));
      };
      function setinput(event) {
        setCustomInput(event.target.value);
        socketRef.current.emit(ACTIONS.CUSTOM_INPUT, { roomId, input: event.target.value });
      }

      return (
        <div>
          <button style={{
            backgroundColor: 'rgb(36, 136, 224)',
            border: 'none',
            color: 'white',
            padding: '15px 32px',
            textAlign: 'center',
            textDecoration: 'none',
            display: 'inline-block',
            fontSize: '16px',
            margin: '3px 10px',
            cursor: 'pointer',
          }}onClick={krdebhai} className="run">
            Run
          </button>

          {/* select tag */}
          <Select  styles={{height:"20px",width:"20px"}} defaultValue={selectedOption}
          
          options={Langauges}
          placeholder={`Select Language`}
          style={customStyles}
          value={selectedOption}
          onChange={(selectedOption) => onSelectChange(selectedOption)}/>






      
          <textarea id="realtimeEditor"></textarea>

          <textarea style={{
              position: "absolute",
              top: "40px",
              right: "25px",
              height: "280px",
              width: "365px",
              backgroundColor: "#282a36",
              color: "white",
            }} onChange={setinput} value={customInput} placeholder='Enter input...'></textarea>

          <textarea
            value={india}
            className="ind"
            style={{
              position: "absolute",
              top: "380px",
              right: "25px",
              height: "280px",
              width: "365px",
              backgroundColor: "#282a36",
              color: "white",
            }}
          ></textarea>
        </div>
      );
    };

    export default Editor;
