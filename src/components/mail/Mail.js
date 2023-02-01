import { useState, useEffect } from "react";
import { SendOutlined, UserOutlined } from "@ant-design/icons";
import { Card, Select, Form, Input, Row, Col, Button, Tag, Modal } from "antd";
import { EditorState, ContentState, convertFromRaw } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import htmlToDraft from "html-to-draftjs";
import draftToHtml from "draftjs-to-html";
import "./Mail.css";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

const { Option } = Select;

const Mail = () => {
    const [editorState, setEditorState] = useState(() =>
        EditorState.createEmpty()
    );

    // useEffect(() => {
    //     console.log(convertFromRaw(editorState.getCurrentContent()));
    // }, [editorState]);
    return (
        <>
            <Card title="Sending mail" type="middle" bordered={true}>
                <Form name="mailForm">
                    <Row>
                        <Col
                            span={3}
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    fontSize: 25,
                                    height: 90,
                                }}
                            >
                                Send
                            </Button>
                        </Col>
                        <Col span={21}>
                            <Form.Item
                                label="To"
                                labelCol={{ span: 2 }}
                                labelAlign="left"
                            >
                                {/* <Input prefix={<UserOutlined />}  /> */}
                                <Select mode="tags" open={false} />
                            </Form.Item>
                            <Form.Item
                                label="CC"
                                labelCol={{ span: 2 }}
                                labelAlign="left"
                            >
                                {/* <Input prefix={<UserOutlined />} /> */}
                                <Select mode="tags" open={false} />
                            </Form.Item>
                            <Form.Item
                                label="Subject"
                                labelCol={{ span: 2 }}
                                labelAlign="left"
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                label="Template"
                                labelCol={{ span: 2 }}
                                labelAlign="left"
                            >
                                <Select>
                                    <Option>Template 1</Option>
                                    <Option>Template 2</Option>
                                    <Option>Template 3</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24}>
                            <Card>
                                <Editor
                                    editorState={editorState}
                                    onEditorStateChange={setEditorState}
                                />
                            </Card>
                        </Col>
                    </Row>
                </Form>
            </Card>
        </>
    );
};

export default Mail;
