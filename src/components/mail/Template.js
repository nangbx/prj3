import {
    Card,
    Button,
    Space,
    Table,
    Modal,
    Input,
    Col,
    Row,
    Typography,
    Form,
    List,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { ContentState, EditorState, convertToRaw } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import "./Template.css";
import { RECORD_MODE } from "../../const/mode";
import draftToHtml from "draftjs-to-html";
import makeRequest from "../../utils/makeRequest";
import { requestUrl } from "../../resource/requestUrl";
import { addListKey } from "../../utils/addListKey";
import htmlToDraft from "html-to-draftjs";

const { Title } = Typography;

const Template = () => {
    const [mode, setMode] = useState(RECORD_MODE.CREATE);
    const [editorState, setEditorState] = useState(() =>
        EditorState.createEmpty()
    );
    const [listTemplate, setListTemplate] = useState([]);
    const [selected, setSelected] = useState();
    useEffect(() => {
        const getData = async () => {
            const [templateRs] = await Promise.all([
                makeRequest({
                    method: "GET",
                    url: requestUrl.template.readUrl(),
                }),
            ]);
            setListTemplate(addListKey(templateRs.data));
        };
        getData();
    }, []);

    const onFinish = async (values) => {
        const { name } = values;
        const content = draftToHtml(
            convertToRaw(editorState.getCurrentContent())
        );
        makeRequest({
            method: "POST",
            url: requestUrl.template.createUrl(),
            data: { name, content },
        }).then((rs) => {
            console.log(rs);
        });
    };
    const handleSelect = (item) => {
        setMode(RECORD_MODE.UPDATE);
        setSelected(item);
        const { contentBlocks, entityMap } = htmlToDraft(item.content);
        const contentState = ContentState.createFromBlockArray(
            contentBlocks,
            entityMap
        );
        setEditorState(EditorState.createWithContent(contentState));
    };
    const handleCreate = () => {
        setMode(RECORD_MODE.CREATE);
        setSelected();
        setEditorState(() => EditorState.createEmpty());
    };
    useEffect(() => {
        console.log(listTemplate);
    }, [listTemplate]);
    return (
        <Row>
            <Col span={5} style={{ marginRight: "10px" }}>
                {/* <Card title="List template">
                    {listTemplate &&
                        listTemplate.map((template) => (
                            <Button type="primary">{template.name}</Button>
                        ))}
                </Card> */}
                <Card title="Template">
                    <List
                        dataSource={listTemplate}
                        renderItem={(item) => (
                            <List.Item>
                                <Button
                                    type="primary"
                                    style={{ width: "100%" }}
                                    onClick={() => handleSelect(item)}
                                >
                                    {item.name}
                                </Button>
                            </List.Item>
                        )}
                    />
                </Card>
            </Col>
            <Col span={18}>
                {mode === RECORD_MODE.CREATE ? (
                    <Card style={{ minHeight: "100%" }}>
                        <Form onFinish={onFinish}>
                            <Form.Item
                                labelCol={{ span: 2 }}
                                labelAlign="left"
                                wrapperCol={{ span: 22 }}
                                label="Name"
                                name="name"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please input your name template!",
                                    },
                                    {
                                        max: 30,
                                        message: "Name is too long!",
                                    },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                            <Editor
                                wrapperClassName="editor-wrapper"
                                editorState={editorState}
                                onEditorStateChange={setEditorState}
                            />
                            <Button
                                type="primary"
                                size="large"
                                htmlType="submit"
                            >
                                Save
                            </Button>
                        </Form>
                    </Card>
                ) : (
                    <Card
                        style={{ minHeight: "100%" }}
                        title={`Name: ${selected.name}`}
                        extra={
                            <Button type="primary" onClick={handleCreate}>
                                Create new template
                            </Button>
                        }
                    >
                        <Editor
                            wrapperClassName="editor-wrapper"
                            editorState={editorState}
                            onEditorStateChange={setEditorState}
                        />
                    </Card>
                )}
            </Col>
        </Row>
    );
};

export default Template;
