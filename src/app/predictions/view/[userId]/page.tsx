import PredictionsViewClient from './PredictionsViewClient'

export default function UserPredictionsPage({ params }: { params: { userId: string } }) {
  return <PredictionsViewClient userId={params.userId} />
}
