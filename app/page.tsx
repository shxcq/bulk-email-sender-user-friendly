import { EmailSenderForm } from "@/components/email-sender-form"
import { CampaignLogs } from "@/components/campaign-logs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Bulk Email Sender</h1>

      <Tabs defaultValue="sender" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="sender">Email Sender</TabsTrigger>
          <TabsTrigger value="logs">Campaign History</TabsTrigger>
        </TabsList>

        <TabsContent value="sender">
          <EmailSenderForm />
        </TabsContent>

        <TabsContent value="logs">
          <CampaignLogs />
        </TabsContent>
      </Tabs>
    </div>
  )
}
