-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "language" TEXT DEFAULT 'EN';

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "catalogCardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "setName" TEXT,
    "imageUrl" TEXT,
    "language" TEXT DEFAULT 'EN',
    "cardType" TEXT,
    "game" TEXT DEFAULT 'OnePiece',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WishlistItem_userId_idx" ON "WishlistItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_userId_catalogCardId_language_key" ON "WishlistItem"("userId", "catalogCardId", "language");

-- CreateIndex
CREATE INDEX "Card_language_idx" ON "Card"("language");

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
