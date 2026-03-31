-- CreateIndex
CREATE INDEX "Debt_fromUserId_idx" ON "Debt"("fromUserId");

-- CreateIndex
CREATE INDEX "Debt_toUserId_idx" ON "Debt"("toUserId");

-- CreateIndex
CREATE INDEX "Expense_status_idx" ON "Expense"("status");

-- CreateIndex
CREATE INDEX "Expense_claimedById_idx" ON "Expense"("claimedById");

-- CreateIndex
CREATE INDEX "Order_organizerId_idx" ON "Order"("organizerId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_assignedToId_idx" ON "OrderItem"("assignedToId");

-- CreateIndex
CREATE INDEX "PaymentProof_fromUserId_idx" ON "PaymentProof"("fromUserId");

-- CreateIndex
CREATE INDEX "PaymentProof_status_idx" ON "PaymentProof"("status");
