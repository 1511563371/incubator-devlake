import Head from 'next/head'
import { useState, useEffect } from 'react'
import axios from 'axios'
import styles from '../styles/Home.module.css'
import { FormGroup, InputGroup, Button, TextArea, Intent } from "@blueprintjs/core"
import Nav from '../components/Nav'
import Sidebar from '../components/Sidebar'
import Content from '../components/Content'

const defaultValue = [
  {
    "plugin": "gitlab",
    "options": {
      "projectId": 8967944
    }
  },
  {
    "plugin": "jira",
    "options": {
      "boardId": 8
    }
  },
  {
    "plugin": "jenkins",
    "options": {}
  }
]

export default function Home(props) {

  const [textAreaBody, setTextAreaBody] = useState(JSON.stringify(defaultValue, null, 2))

  const sendTrigger = async (e) => {
    e.preventDefault()

    try {
      await axios.post(
        `/api/triggers/task`,
        textAreaBody,
        { headers: { "Content-Type": "application/json" }},
      )
    } catch (e) {
      console.error(e)
    }

  }

  const [pendingTasks, setPendingTasks] = useState([])
  const [stage, setStage] = useState(0)
  const [grafanaUrl, setGrafanaUrl] = useState(3002)
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await axios.get("/api/triggers/pendings")
      console.log(res)
      if (res.data.tasks.length > 0) {
        setStage(1)
      } else if (stage === 1) {
        setStage(2)
      }
      setPendingTasks(res.data.tasks)
      setGrafanaUrl(`${location.protocol}//${location.hostname}:${res.data.grafanaPort}`)
    }, 1000);
    return () => clearInterval(interval);
  }, [])

  return (
    <div className={styles.container}>

      <Head>
        <title>Devlake Config-UI</title>
        <meta name="description" content="Lake: Config" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@500;600&display=swap" rel="stylesheet" />
      </Head>

      <Nav />
      <Sidebar />
      <Content>
        <main className={styles.main}>
          {stage === 2 &&
            <div>
              <div className={styles.headlineContainer}>
                <h1>Done</h1>
                <p className={styles.description}>Please open grafana to observe dev metrics...</p>
                <a href={grafanaUrl}>Go to grafana</a>
              </div>
            </div>
          }
          {stage === 1 &&
            <div>
              <div className={styles.headlineContainer}>
                <h1>Work in progress</h1>
                <p className={styles.description}>Please wait...</p>
              </div>
              {pendingTasks.map(task =>
                <div>{task.plugin}: {task.progress * 100}%</div>
              )}
            </div>
          }
          {stage === 0 &&
            <div>
              <div className={styles.headlineContainer}>
                <h1>Triggers</h1>
                <p className={styles.description}>Trigger data collection on your plugins</p>
              </div>

              <form className={styles.form}>
                <div className={styles.headlineContainer}>
                <p className={styles.description}>Create a http request to trigger data collect tasks, please replace
                your <code>gitlab projectId</code> and <code>jira boardId</code> in the request body. This can take up
                to 20 minutes for large projects. (gitlab 10k+ commits or jira 5k+ issues)</p>
                </div>

                <div className={styles.formContainer}>
                  <TextArea
                    growVertically={true}
                    large={true}
                    intent={Intent.PRIMARY}
                    fill={true}
                    className={styles.codeArea}
                    defaultValue={textAreaBody}
                    onChange={(e) => setTextAreaBody(e.target.value)}
                  />
                </div>

                <Button outlined={true} large={true} className={styles.saveBtn} onClick={sendTrigger}>Trigger Collection</Button>
              </form>
            </div>
          }
        </main>
      </Content>
    </div>
  )
}