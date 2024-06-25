// PostPageServer.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { useHandleFileUpload } from '@/hooks/use-handle-file-upload'
import PostForm from '@/app/(root)/(routes)/(pages)/post/_components/post-form'
import { getSession } from 'next-auth/react'

export default async function PostPageServer() {
  const role = await auth();

  if (!role) {
    redirect('/login');
  }

  const selectedDate = null;
  const { videoUrl } = useHandleFileUpload();

  console.log(role)
  return (
    <div className="flex justify-center items-center min-h-screen p-5">
      <div className="flex justify-center w-full max-w-4xl">
        <PostForm videoUrl={videoUrl} selectedDate={selectedDate} role={role}/>
      </div>
    </div>
  );
}
