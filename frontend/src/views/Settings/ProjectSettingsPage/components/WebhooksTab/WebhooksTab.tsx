import { useTranslation } from "react-i18next";
import { faInfoCircle, faPlug, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";

import { useNotificationContext } from "@app/components/context/Notifications/NotificationProvider";
import {
  Button,
  DeleteActionModal,
  EmptyState,
  Table,
  TableContainer,
  TableSkeleton,
  TBody,
  Td,
  THead,
  Tooltip,
  Tr
} from "@app/components/v2";
import { useWorkspace } from "@app/context";
import { usePopUp } from "@app/hooks";
import {
  useCreateWebhook,
  useDeleteWebhook,
  useGetWebhooks,
  useTestWebhook,
  useUpdateWebhook
} from "@app/hooks/api";

import { AddWebhookForm, TFormSchema } from "./AddWebhookForm";

export const WebhooksTab = () => {
  const { t } = useTranslation();
  const { createNotification } = useNotificationContext();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?._id || "";
  const { popUp, handlePopUpOpen, handlePopUpToggle, handlePopUpClose } = usePopUp([
    "addWebhook",
    "deleteWebhook"
  ] as const);

  const { data: webhooks, isLoading: isWebhooksLoading } = useGetWebhooks(workspaceId);

  // mutation
  const { mutateAsync: createWebhook } = useCreateWebhook();
  const {
    mutateAsync: testWebhook,
    variables: testWebhookVars,
    isLoading: isTestWebhookSubmitting
  } = useTestWebhook();
  const {
    mutateAsync: updateWebhook,
    variables: updateWebhookVars,
    isLoading: isUpdateWebhookSubmitting
  } = useUpdateWebhook();
  const { mutateAsync: deleteWebhook } = useDeleteWebhook();

  const handleWebhookCreate = async (data: TFormSchema) => {
    try {
      await createWebhook({
        ...data,
        workspaceId
      });
      handlePopUpClose("addWebhook");
      createNotification({
        type: "success",
        text: "Successfully created webhook"
      });
    } catch (err) {
      console.log(err);
      createNotification({
        type: "error",
        text: "Failed to create webhook"
      });
    }
  };

  const handleWebhookDisable = async (webhookId: string, isDisabled: boolean) => {
    try {
      await updateWebhook({
        webhookId,
        workspaceId,
        isDisabled
      });
      createNotification({
        type: "success",
        text: "Successfully updated webhook"
      });
    } catch (err) {
      console.log(err);
      createNotification({
        type: "error",
        text: "Failed to update webhook"
      });
    }
  };

  const handleWebhookDelete = async () => {
    try {
      const webhookId = popUp?.deleteWebhook?.data as string;
      await deleteWebhook({
        webhookId,
        workspaceId
      });
      handlePopUpClose("deleteWebhook");
      createNotification({
        type: "success",
        text: "Successfully deleted webhook"
      });
    } catch (err) {
      console.log(err);
      createNotification({
        type: "error",
        text: "Failed to delete webhook"
      });
    }
  };

  const handleWebhookTest = async (webhookId: string) => {
    try {
      await testWebhook({
        webhookId,
        workspaceId
      });
      createNotification({
        type: "success",
        text: "Successfully triggered webhook"
      });
    } catch (err) {
      console.log(err);
      createNotification({
        type: "error",
        text: "Failed to trigger webhook"
      });
    }
  };

  return (
    <div className="mb-6 max-w-screen-lg rounded-lg border border-mineshaft-600 bg-mineshaft-900 p-4">
      <div className="flex justify-between">
        <p className="text-xl font-semibold text-mineshaft-100">{t("settings.webhooks.title")}</p>
        <Button
          onClick={() => handlePopUpOpen("addWebhook")}
          leftIcon={<FontAwesomeIcon icon={faPlus} />}
        >
          Create
        </Button>
      </div>
      <p className="mb-8 text-gray-400">{t("settings.webhooks.description")}</p>
      <div>
        <TableContainer>
          <Table>
            <THead>
              <Tr>
                <Td>URL</Td>
                <Td>Environment</Td>
                <Td>Secret Path</Td>
                <Td>Status</Td>
                <Td className="text-right">Action</Td>
              </Tr>
            </THead>
            <TBody>
              {isWebhooksLoading && <TableSkeleton columns={5} innerKey="webhooks-loading" />}
              {!isWebhooksLoading && webhooks && webhooks?.length === 0 && (
                <Tr>
                  <Td colSpan={5}>
                    <EmptyState title="No webhooks found" icon={faPlug} />
                  </Td>
                </Tr>
              )}
              {!isWebhooksLoading &&
                webhooks?.map(
                  ({
                    _id: id,
                    url,
                    environment,
                    secretPath,
                    lastStatus,
                    isDisabled,
                    updatedAt,
                    lastRunErrorMessage
                  }) => (
                    <Tr key={id}>
                      <Td className="max-w-xs overflow-hidden text-ellipsis hover:overflow-auto hover:break-all">
                        {url}
                      </Td>
                      <Td>{environment}</Td>
                      <Td>{secretPath}</Td>
                      <Td>
                        {!lastStatus ? (
                          "-"
                        ) : (
                          <div className="inline-flex w-min items-center rounded bg-mineshaft-600 px-2 py-0.5 text-sm">
                            {lastStatus}{" "}
                            <Tooltip
                              content={
                                <div className="text-xs">
                                  <div>
                                    Updated At: {dayjs(updatedAt).format("YYYY-MM-DD, hh:mm A")}
                                  </div>
                                  {lastRunErrorMessage && (
                                    <div className="mt-2 text-red">
                                      Error: {lastRunErrorMessage}
                                    </div>
                                  )}
                                </div>
                              }
                            >
                              <FontAwesomeIcon
                                className={`ml-1 ${
                                  lastStatus === "failed" ? "text-red" : "text-green"
                                }`}
                                icon={faInfoCircle}
                              />
                            </Tooltip>
                          </div>
                        )}
                      </Td>
                      <Td>
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="star"
                            size="xs"
                            onClick={() => handleWebhookTest(id)}
                            isDisabled={
                              isTestWebhookSubmitting && testWebhookVars?.webhookId === id
                            }
                            isLoading={isTestWebhookSubmitting && testWebhookVars?.webhookId === id}
                          >
                            Test
                          </Button>
                          <Button
                            variant="outline_bg"
                            size="xs"
                            onClick={() => handleWebhookDisable(id, !isDisabled)}
                            isDisabled={
                              isUpdateWebhookSubmitting && updateWebhookVars?.webhookId === id
                            }
                            isLoading={
                              isUpdateWebhookSubmitting && updateWebhookVars?.webhookId === id
                            }
                          >
                            {isDisabled ? "Enable" : "Disable"}
                          </Button>
                          <Button
                            variant="outline_bg"
                            className="border-red-800 bg-red-800 hover:border-red-700 hover:bg-red-700"
                            colorSchema="danger"
                            size="xs"
                            onClick={() => handlePopUpOpen("deleteWebhook", id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  )
                )}
            </TBody>
          </Table>
        </TableContainer>
      </div>
      <AddWebhookForm
        environments={currentWorkspace?.environments}
        isOpen={popUp?.addWebhook?.isOpen}
        onOpenChange={(isOpen) => handlePopUpToggle("addWebhook", isOpen)}
        onCreateWebhook={handleWebhookCreate}
      />
      <DeleteActionModal
        isOpen={popUp.deleteWebhook.isOpen}
        deleteKey="remove"
        title="Are you sure you want to delete this webhook?"
        onChange={(isOpen) => handlePopUpToggle("deleteWebhook", isOpen)}
        onClose={() => handlePopUpClose("deleteWebhook")}
        onDeleteApproved={handleWebhookDelete}
      />
    </div>
  );
};
